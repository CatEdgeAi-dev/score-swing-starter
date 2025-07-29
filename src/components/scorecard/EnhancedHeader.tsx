import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Cloud, 
  Sun, 
  CloudRain, 
  Snowflake,
  Edit3,
  CheckCircle,
  ArrowLeft,
  RotateCcw
} from 'lucide-react';

interface EnhancedHeaderProps {
  courseName: string;
  date: string;
  weather: string;
  currentHole: number;
  totalHoles: number;
  onCourseNameChange: (name: string) => void;
  onWeatherChange: (weather: string) => void;
  onNewRound?: () => void;
}

const weatherOptions = [
  { label: 'Sunny', icon: Sun, value: 'sunny' },
  { label: 'Cloudy', icon: Cloud, value: 'cloudy' },
  { label: 'Rainy', icon: CloudRain, value: 'rainy' },
  { label: 'Snowy', icon: Snowflake, value: 'snowy' }
];

export const EnhancedHeader: React.FC<EnhancedHeaderProps> = ({
  courseName,
  date,
  weather,
  currentHole,
  totalHoles,
  onCourseNameChange,
  onWeatherChange,
  onNewRound
}) => {
  const navigate = useNavigate();
  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [tempCourseName, setTempCourseName] = useState(courseName);
  const [isWeatherDialogOpen, setIsWeatherDialogOpen] = useState(false);

  const handleCourseNameSave = () => {
    onCourseNameChange(tempCourseName);
    setIsEditingCourse(false);
  };

  const handleWeatherSelect = (weatherValue: string) => {
    onWeatherChange(weatherValue);
    setIsWeatherDialogOpen(false);
  };

  const getWeatherIcon = () => {
    const weatherOption = weatherOptions.find(w => w.value === weather);
    return weatherOption ? weatherOption.icon : Sun;
  };

  const getWeatherLabel = () => {
    const weatherOption = weatherOptions.find(w => w.value === weather);
    return weatherOption ? weatherOption.label : 'Sunny';
  };

  const progressPercentage = (currentHole / totalHoles) * 100;

  return (
    <Card className="w-full mb-4">
      <CardContent className="p-4 space-y-4">
        {/* Navigation and actions header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/rounds')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Rounds
          </Button>
          
          {onNewRound && (
            <Button
              variant="outline"
              size="sm"
              onClick={onNewRound}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              New Round
            </Button>
          )}
        </div>
        
        <Separator />
        
        {/* Course Name */}
        <div className="flex items-center justify-between">
          {isEditingCourse ? (
            <div className="flex items-center space-x-2 flex-1">
              <Input
                value={tempCourseName}
                onChange={(e) => setTempCourseName(e.target.value)}
                className="flex-1"
                placeholder="Enter course name"
              />
              <Button size="sm" onClick={handleCourseNameSave}>
                <CheckCircle className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-semibold">{courseName}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingCourse(true)}
                className="p-1"
              >
                <Edit3 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Date and Weather */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{date}</span>
          </div>
          
          <Dialog open={isWeatherDialogOpen} onOpenChange={setIsWeatherDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                {(() => {
                  const WeatherIcon = getWeatherIcon();
                  return <WeatherIcon className="h-4 w-4" />;
                })()}
                <span className="text-sm">{getWeatherLabel()}</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Select Weather</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                {weatherOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={weather === option.value ? "default" : "outline"}
                    className="flex items-center space-x-2 h-12"
                    onClick={() => handleWeatherSelect(option.value)}
                  >
                    <option.icon className="h-4 w-4" />
                    <span>{option.label}</span>
                  </Button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Separator />

        {/* Progress Indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Progress</span>
            <Badge variant="secondary">
              Hole {currentHole} of {totalHoles}
            </Badge>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
};