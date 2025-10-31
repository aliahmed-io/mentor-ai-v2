'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Brain, FileText, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { QuizSetup as QuizSetupType } from '@/types/quiz';

interface QuizSetupProps {
  onSetupComplete: (setup: QuizSetupType) => void;
}

const difficultyOptions = [
  { value: 'easy', label: 'Easy', description: 'Basic concepts and fundamentals', icon: '🟢' },
  { value: 'medium', label: 'Medium', description: 'Intermediate level questions', icon: '🟡' },
  { value: 'hard', label: 'Hard', description: 'Advanced and challenging topics', icon: '🔴' },
] as const;

const topicSuggestions = [
  'JavaScript', 'React', 'Python', 'TypeScript', 'Node.js',
  'CSS', 'HTML', 'Machine Learning', 'Data Structures',
  'Algorithms', 'Database Design', 'System Design'
];

export default function QuizSetup({ onSetupComplete }: QuizSetupProps) {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionCount, setQuestionCount] = useState(10);
  const [studyMaterial, setStudyMaterial] = useState('');
  const [fileContent, setFileContent] = useState('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setFileContent(content);
        setStudyMaterial(content);
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    const setup: QuizSetupType = {
      topic: topic.trim(),
      difficulty,
      questionCount,
      studyMaterial: studyMaterial.trim() || undefined,
    };

    onSetupComplete(setup);
  };

  return (
    <div className="p-2 md:p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl mx-auto"
      >
        <Card>
          <CardHeader className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted"
            >
              <img src="/white-short-logo.svg" alt="Quiz Logo" className="h-8 w-8" />
            </motion.div>
            <CardTitle className="text-3xl font-bold text-foreground">
              Create Your Quiz
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
              Customize your learning experience with AI-powered questions
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Topic Selection */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-3"
              >
                <Label htmlFor="topic" className="text-sm font-semibold flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Quiz Topic
                </Label>
                <Input
                  id="topic"
                  placeholder="e.g., JavaScript, React, Python..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="text-lg py-6"
                  required
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {topicSuggestions.map((suggestion) => (
                    <Button
                      key={suggestion}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setTopic(suggestion)}
                      className="text-xs"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </motion.div>

              {/* Difficulty Selection */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-3"
              >
                <Label className="text-sm font-semibold">Difficulty Level</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {difficultyOptions.map((option) => (
                    <motion.button
                      key={option.value}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setDifficulty(option.value)}
                      className={`rounded-lg border-2 p-4 text-left transition-all ${
                        difficulty === option.value
                          ? 'border-primary bg-muted shadow-sm'
                          : 'border-muted hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{option.icon}</span>
                        <div>
                          <div className="font-semibold">{option.label}</div>
                          <div className="text-sm text-muted-foreground">{option.description}</div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Question Count */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-3"
              >
                <Label htmlFor="questionCount" className="text-sm font-semibold">
                  Number of Questions
                </Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="questionCount"
                    type="number"
                    min="5"
                    max="50"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(parseInt(e.target.value) || 10)}
                    className="w-32"
                  />
                  <div className="flex gap-2">
                    {[5, 10, 15, 20].map((count) => (
                      <Button
                        key={count}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setQuestionCount(count)}
                        className={questionCount === count ? 'bg-muted' : ''}
                      >
                        {count}
                      </Button>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Study Material */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="space-y-3"
              >
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Study Material (Optional)
                </Label>
                <div className="space-y-3">
                  <Textarea
                    placeholder="Paste your study material here, or upload a file below..."
                    value={studyMaterial}
                    onChange={(e) => setStudyMaterial(e.target.value)}
                    className="min-h-[120px] resize-none"
                  />
                  <div className="flex items-center gap-3">
                    <Label
                      htmlFor="file-upload"
                      className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-2 transition-colors hover:border-muted-foreground/40 hover:bg-muted"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Text File
                    </Label>
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".txt,.md,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    {fileContent && (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        ✅ File uploaded successfully
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Submit Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="pt-4"
              >
                <Button type="submit" className="w-full py-6 text-lg font-semibold" disabled={!topic.trim()}>
                  Generate Quiz ✨
                </Button>
              </motion.div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
