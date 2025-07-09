'use client';

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, ArrowRight, Baby, Target } from "lucide-react";

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    fatherName: '',
    fatherAge: '',
    numberOfKids: '',
    childrenData: [] as Array<{
      name: string;
      age: string;
      gender: 'boy' | 'girl';
    }>,
    primaryGoals: [] as string[],
    relationshipStatus: 'married' as 'single' | 'partnered' | 'married' | 'divorced' | 'widowed',
    primaryConcerns: [] as string[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const goalOptions = [
    'Build stronger emotional connection with my children',
    'Improve communication skills',
    'Learn about child development milestones',
    'Create better work-life balance',
    'Develop parenting confidence',
    'Establish routines and structure',
    'Support my children\'s independence',
    'Connect with other fathers',
    'Manage parenting stress and anxiety',
    'Be more present and engaged'
  ];

  const concernOptions = [
    'Sleep training and bedtime routines',
    'Discipline and setting boundaries',
    'Balancing work and family time',
    'Partner relationship and co-parenting',
    'Managing my own stress and emotions',
    'Screen time and technology limits',
    'Child development and milestones',
    'Communication with my children',
    'Sibling rivalry and conflicts',
    'Building confidence as a father'
  ];

  const steps = [
    {
      title: 'Welcome to DadBase!',
      description: 'Let\'s get to know you better so we can provide personalized support.',
      icon: Shield
    },
    {
      title: 'About You',
      description: 'Tell us about yourself as a father.',
      icon: Baby
    },
    {
      title: 'Your Children',
      description: 'Share details about your kids so we can give age-appropriate advice.',
      icon: Baby
    },
    {
      title: 'Your Goals',
      description: 'What do you hope to achieve on your fatherhood journey?',
      icon: Target
    },
    {
      title: 'Your Concerns',
      description: 'What challenges are you facing that we can help with?',
      icon: Target
    }
  ];

  // Check if user should be here
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/');
    }
  }, [isLoaded, user, router]);

  const handleChildrenDataChange = (index: number, field: string, value: string) => {
    const newChildren = [...formData.childrenData];
    newChildren[index] = { ...newChildren[index], [field]: value };
    setFormData(prev => ({ ...prev, childrenData: newChildren }));
  };

  const addChild = () => {
    setFormData(prev => ({
      ...prev,
      childrenData: [...prev.childrenData, { name: '', age: '', gender: 'boy' }]
    }));
  };

  const removeChild = (index: number) => {
    setFormData(prev => ({
      ...prev,
      childrenData: prev.childrenData.filter((_, i) => i !== index)
    }));
  };

  const toggleArrayValue = (field: 'primaryGoals' | 'primaryConcerns', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value]
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Store profile data in localStorage for testing
      const profileData = {
        fatherName: formData.fatherName,
        childrenAges: formData.childrenData.map(child => parseInt(child.age)).filter(age => !isNaN(age)),
        relationshipStatus: formData.relationshipStatus,
        primaryConcerns: formData.primaryConcerns,
        fatheringGoals: formData.primaryGoals,
        communicationStyle: 'supportive' as const,
        preferences: {
          fatherAge: formData.fatherAge,
          numberOfKids: formData.numberOfKids,
          childrenData: formData.childrenData
        }
      };

      // Save to localStorage for testing
      localStorage.setItem('dadbase-profile', JSON.stringify(profileData));
      localStorage.setItem('dadbase-onboarding-completed', 'true');

      // Try to save to API (but don't block on it)
      try {
        await fetch('/api/users/sync', { method: 'POST' });
        
        const response = await fetch('/api/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(profileData),
        });

        if (response.ok) {
          console.log('Profile saved to database successfully');
        }
      } catch (apiError) {
        console.log('API not available, profile saved locally for testing');
      }
      
      // Always redirect to dashboard
      router.push('/');
      
    } catch (error) {
      console.error('Error during onboarding:', error);
      // Even if everything fails, complete onboarding for testing
      localStorage.setItem('dadbase-onboarding-completed', 'true');
      router.push('/');
    } finally {
      setIsSubmitting(false);
    }
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

  const canProceed = () => {
    switch (currentStep) {
      case 0: return true;
      case 1: return formData.fatherName.trim().length > 0;
      case 2: return formData.childrenData.length > 0 && formData.childrenData.every(child => 
        child.name.trim().length > 0 && child.age.trim().length > 0
      );
      case 3: return formData.primaryGoals.length > 0;
      case 4: return formData.primaryConcerns.length > 0;
      default: return false;
    }
  };

  // Update numberOfKids when children data changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      numberOfKids: prev.childrenData.length.toString()
    }));
  }, [formData.childrenData]);

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Shield className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Welcome to DadBase, {user?.firstName || 'Dad'}!
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                You've joined a community of fathers committed to growth and connection. 
                Let's personalize your experience with a few quick questions.
              </p>
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 max-w-2xl mx-auto">
              <h3 className="font-semibold text-foreground mb-3">What you'll get:</h3>
              <ul className="text-sm text-muted-foreground space-y-2 text-left">
                <li>• Personalized AI coaching based on your children's ages</li>
                <li>• Evidence-based advice from Dr. Anna Machin's research</li>
                <li>• Goal tracking and progress monitoring</li>
                <li>• Connection with other fathers in similar situations</li>
                <li>• Daily insights tailored to your parenting journey</li>
              </ul>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  What should we call you?
                </label>
                <input
                  type="text"
                  value={formData.fatherName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fatherName: e.target.value }))}
                  placeholder="Your first name"
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Your age (optional)
                </label>
                <input
                  type="number"
                  value={formData.fatherAge}
                  onChange={(e) => setFormData(prev => ({ ...prev, fatherAge: e.target.value }))}
                  placeholder="Your age"
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Relationship Status
              </label>
              <select
                value={formData.relationshipStatus}
                onChange={(e) => setFormData(prev => ({ ...prev, relationshipStatus: e.target.value as any }))}
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

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Tell us about your children</h3>
              <button
                type="button"
                onClick={addChild}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Add Child
              </button>
            </div>

            {formData.childrenData.map((child, index) => (
              <div key={index} className="bg-muted/20 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-foreground">Child {index + 1}</h4>
                  {formData.childrenData.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeChild(index)}
                      className="text-destructive hover:text-destructive/80 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={child.name}
                      onChange={(e) => handleChildrenDataChange(index, 'name', e.target.value)}
                      placeholder="Child's name"
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Age
                    </label>
                    <input
                      type="number"
                      value={child.age}
                      onChange={(e) => handleChildrenDataChange(index, 'age', e.target.value)}
                      placeholder="Age"
                      min="0"
                      max="25"
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Gender
                    </label>
                    <select
                      value={child.gender}
                      onChange={(e) => handleChildrenDataChange(index, 'gender', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="boy">Boy</option>
                      <option value="girl">Girl</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}

            {formData.childrenData.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>Click "Add Child" to start adding your children's information.</p>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                What are your main goals as a father?
              </h3>
              <p className="text-muted-foreground mb-6">
                Select all that apply. These help us personalize your experience.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {goalOptions.map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => toggleArrayValue('primaryGoals', goal)}
                    className={`p-3 text-left rounded-lg border transition-colors ${
                      formData.primaryGoals.includes(goal)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                What challenges are you facing?
              </h3>
              <p className="text-muted-foreground mb-6">
                Select your main concerns so we can provide relevant support.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {concernOptions.map((concern) => (
                  <button
                    key={concern}
                    type="button"
                    onClick={() => toggleArrayValue('primaryConcerns', concern)}
                    className={`p-3 text-left rounded-lg border transition-colors ${
                      formData.primaryConcerns.includes(concern)
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border hover:border-accent/50'
                    }`}
                  >
                    {concern}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Loading...</h2>
          <p className="text-muted-foreground">Please wait...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-primary mr-3" />
              <div>
                <h1 className="text-xl font-bold text-foreground">DadBase</h1>
                <p className="text-xs text-muted-foreground">Your Command Center for Fatherhood</p>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Progress Bar */}
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
          <div className="dadbase-card mb-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {steps[currentStep].title}
              </h2>
              <p className="text-muted-foreground">
                {steps[currentStep].description}
              </p>
            </div>
            
            {renderStepContent()}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="px-6 py-3 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            {currentStep === steps.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={!canProceed() || isSubmitting}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
              >
                <span>{isSubmitting ? 'Saving...' : 'Complete Setup'}</span>
                {!isSubmitting && <ArrowRight className="h-4 w-4" />}
              </button>
            ) : (
              <button
                onClick={nextStep}
                disabled={!canProceed()}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
              >
                <span>Next</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 