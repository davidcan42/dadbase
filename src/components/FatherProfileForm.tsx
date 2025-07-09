'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User, Baby, Heart, Target, Save } from 'lucide-react';

const fatherProfileSchema = z.object({
  fatherName: z.string().min(2, 'Name must be at least 2 characters'),
  childrenAges: z.array(z.number().min(0).max(18)),
  fatheringSince: z.string().optional(),
  relationshipStatus: z.enum(['single', 'partnered', 'married', 'divorced', 'widowed']),
  primaryConcerns: z.array(z.string()).min(1, 'Please select at least one concern'),
  fatheringGoals: z.array(z.string()).min(1, 'Please select at least one goal'),
  communicationStyle: z.enum(['direct', 'supportive', 'analytical', 'encouraging']),
});

type FatherProfileData = z.infer<typeof fatherProfileSchema>;

interface FatherProfileFormProps {
  initialData?: Partial<FatherProfileData>;
  onSubmit: (data: FatherProfileData) => void;
  isLoading?: boolean;
}

const concernOptions = [
  'Sleep training and routines',
  'Bonding with my child',
  'Discipline and boundaries',
  'Child development milestones',
  'Balancing work and family',
  'Partner relationship',
  'Managing stress and anxiety',
  'Communication with child',
  'Screen time and technology',
  'Health and nutrition',
];

const goalOptions = [
  'Build stronger emotional connection',
  'Improve communication skills',
  'Learn child development basics',
  'Create better work-life balance',
  'Develop parenting confidence',
  'Strengthen partnership',
  'Manage parenting stress',
  'Establish routines and structure',
  'Support child\'s independence',
  'Connect with other fathers',
];

export default function FatherProfileForm({ 
  initialData, 
  onSubmit, 
  isLoading = false 
}: FatherProfileFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [childAgeInput, setChildAgeInput] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
  } = useForm<FatherProfileData>({
    resolver: zodResolver(fatherProfileSchema),
    defaultValues: {
      fatherName: initialData?.fatherName || '',
      childrenAges: initialData?.childrenAges || [],
      relationshipStatus: initialData?.relationshipStatus || 'married',
      primaryConcerns: initialData?.primaryConcerns || [],
      fatheringGoals: initialData?.fatheringGoals || [],
      communicationStyle: initialData?.communicationStyle || 'supportive',
    },
  });

  const watchedValues = watch();

  const steps = [
    {
      title: 'Personal Information',
      description: 'Tell us about yourself',
      icon: User,
    },
    {
      title: 'Family Details',
      description: 'Your children and family situation',
      icon: Baby,
    },
    {
      title: 'Concerns & Challenges',
      description: 'What do you need support with?',
      icon: Heart,
    },
    {
      title: 'Goals & Preferences',
      description: 'How can we help you grow?',
      icon: Target,
    },
  ];

  const addChildAge = () => {
    const age = parseInt(childAgeInput);
    if (age >= 0 && age <= 18) {
      const currentAges = getValues('childrenAges');
      setValue('childrenAges', [...currentAges, age]);
      setChildAgeInput('');
    }
  };

  const removeChildAge = (index: number) => {
    const currentAges = getValues('childrenAges');
    setValue('childrenAges', currentAges.filter((_, i) => i !== index));
  };

  const toggleArrayValue = (fieldName: 'primaryConcerns' | 'fatheringGoals', value: string) => {
    const currentValues = getValues(fieldName);
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    setValue(fieldName, newValues);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                What should we call you?
              </label>
              <input
                {...register('fatherName')}
                type="text"
                placeholder="Your first name"
                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              {errors.fatherName && (
                <p className="text-destructive text-sm mt-1">{errors.fatherName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Relationship Status
              </label>
              <select
                {...register('relationshipStatus')}
                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="single">Single</option>
                <option value="partnered">In a partnership</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
              </select>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Children's Ages
              </label>
              <div className="flex space-x-2 mb-3">
                <input
                  type="number"
                  min="0"
                  max="18"
                  value={childAgeInput}
                  onChange={(e) => setChildAgeInput(e.target.value)}
                  placeholder="Age in years"
                  className="flex-1 px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={addChildAge}
                  className="px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {watchedValues.childrenAges.map((age, index) => (
                  <span
                    key={index}
                    className="dadbase-badge flex items-center space-x-1"
                  >
                    <span>{age} years old</span>
                    <button
                      type="button"
                      onClick={() => removeChildAge(index)}
                      className="text-accent-foreground hover:text-accent-foreground/80"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              {errors.childrenAges && (
                <p className="text-destructive text-sm mt-1">Please add at least one child's age</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                When did you become a father? (Optional)
              </label>
              <input
                {...register('fatheringSince')}
                type="date"
                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-4">
                What are your main parenting concerns? (Select all that apply)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {concernOptions.map((concern) => (
                  <button
                    key={concern}
                    type="button"
                    onClick={() => toggleArrayValue('primaryConcerns', concern)}
                    className={`p-3 text-left rounded-lg border transition-colors ${
                      watchedValues.primaryConcerns.includes(concern)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {concern}
                  </button>
                ))}
              </div>
              {errors.primaryConcerns && (
                <p className="text-destructive text-sm mt-1">{errors.primaryConcerns.message}</p>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-4">
                What are your fathering goals? (Select all that apply)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {goalOptions.map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => toggleArrayValue('fatheringGoals', goal)}
                    className={`p-3 text-left rounded-lg border transition-colors ${
                      watchedValues.fatheringGoals.includes(goal)
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border hover:border-accent/50'
                    }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
              {errors.fatheringGoals && (
                <p className="text-destructive text-sm mt-1">{errors.fatheringGoals.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Communication Style Preference
              </label>
              <select
                {...register('communicationStyle')}
                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="direct">Direct and straightforward</option>
                <option value="supportive">Warm and supportive</option>
                <option value="analytical">Analytical and detailed</option>
                <option value="encouraging">Encouraging and motivational</option>
              </select>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="dadbase-card max-w-2xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className={`flex items-center space-x-2 ${
                  index === currentStep ? 'text-primary' : 
                  index < currentStep ? 'text-accent' : 'text-muted-foreground'
                }`}
              >
                <div className={`p-2 rounded-full ${
                  index === currentStep ? 'bg-primary/10' :
                  index < currentStep ? 'bg-accent/10' : 'bg-muted'
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="hidden md:block text-sm font-medium">{step.title}</span>
              </div>
            );
          })}
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {steps[currentStep].title}
          </h2>
          <p className="text-muted-foreground mb-6">
            {steps[currentStep].description}
          </p>
          
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="px-6 py-3 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {currentStep === steps.length - 1 ? (
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{isLoading ? 'Saving...' : 'Save Profile'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={nextStep}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Next
            </button>
          )}
        </div>
      </form>
    </div>
  );
} 