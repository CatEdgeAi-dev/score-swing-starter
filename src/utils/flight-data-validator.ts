/**
 * Flight Data Validation Utilities
 * Ensures data consistency between UI and database
 */

import { logger } from './logger';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface FlightPlayer {
  id: string;
  name: string;
  isRegistered: boolean;
  userId?: string;
}

export interface DatabasePlayer {
  id: string;
  user_id: string | null;
  guest_name: string | null;
  handicap: number | null;
  handicap_locked: boolean;
}

/**
 * Validates flight creation data before submission
 */
export const validateFlightCreation = (data: {
  name: string;
  courseName: string;
  players: FlightPlayer[];
}): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic data validation
  if (!data.name?.trim()) {
    errors.push('Flight name is required');
  }

  if (!data.courseName?.trim()) {
    errors.push('Course name is required');
  }

  if (!data.players || data.players.length === 0) {
    errors.push('At least one player is required');
  }

  if (data.players.length > 4) {
    errors.push('Maximum 4 players allowed per flight');
  }

  // Player validation
  data.players.forEach((player, index) => {
    if (!player.name?.trim()) {
      errors.push(`Player ${index + 1} must have a name`);
    }

    if (player.isRegistered && !player.userId) {
      errors.push(`Registered player ${player.name} is missing user ID`);
    }

    if (!player.isRegistered && player.userId) {
      warnings.push(`Guest player ${player.name} has unexpected user ID`);
    }
  });

  // Check for duplicate names
  const names = data.players.map(p => p.name.trim().toLowerCase());
  const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
  if (duplicates.length > 0) {
    errors.push('Player names must be unique');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validates consistency between flight context and database records
 */
export const validateFlightDataConsistency = (
  flightPlayers: FlightPlayer[],
  dbPlayers: DatabasePlayer[]
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check player count consistency
  if (flightPlayers.length !== dbPlayers.length) {
    errors.push(
      `Player count mismatch: UI has ${flightPlayers.length}, DB has ${dbPlayers.length}`
    );
  }

  // Validate each flight player has corresponding DB record
  flightPlayers.forEach(flightPlayer => {
    const dbRecord = dbPlayers.find(db => db.id === flightPlayer.id);
    
    if (!dbRecord) {
      errors.push(`No database record found for player: ${flightPlayer.name} (ID: ${flightPlayer.id})`);
      return;
    }

    // Validate registered player consistency
    if (flightPlayer.isRegistered) {
      if (!dbRecord.user_id) {
        errors.push(`Registered player ${flightPlayer.name} missing user_id in database`);
      }
      if (dbRecord.guest_name) {
        warnings.push(`Registered player ${flightPlayer.name} has guest_name in database`);
      }
    }

    // Validate guest player consistency
    if (!flightPlayer.isRegistered) {
      if (dbRecord.user_id) {
        errors.push(`Guest player ${flightPlayer.name} has user_id in database`);
      }
      if (!dbRecord.guest_name) {
        errors.push(`Guest player ${flightPlayer.name} missing guest_name in database`);
      }
      if (dbRecord.guest_name !== flightPlayer.name) {
        warnings.push(`Guest name mismatch: UI="${flightPlayer.name}", DB="${dbRecord.guest_name}"`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Logs validation results with appropriate log levels
 */
export const logValidationResults = (
  context: string,
  result: ValidationResult
): void => {
  if (result.isValid) {
    logger.info(`✅ ${context} validation passed`, {
      warnings: result.warnings
    });
  } else {
    logger.error(`❌ ${context} validation failed`, {
      errors: result.errors,
      warnings: result.warnings
    });
  }

  // Log warnings separately
  result.warnings.forEach(warning => {
    logger.warn(`⚠️ ${context}: ${warning}`);
  });
};

/**
 * Checks if all players have valid database UUIDs
 */
export const validatePlayerIds = (players: FlightPlayer[]): ValidationResult => {
  const errors: string[] = [];
  
  players.forEach(player => {
    if (!player.id) {
      errors.push(`Player ${player.name} is missing ID`);
    } else if (player.id.length < 30) { // UUIDs are typically 36 chars, but allow some flexibility
      errors.push(`Player ${player.name} has invalid ID format: ${player.id}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings: []
  };
};