// SAT Domain Mapping Tool

/**
 * Maps domain values to English display names
 */
export const getDomainDisplayName = (domain: string | null | undefined): string => {
  if (!domain) return '';
  
  const domainMap: Record<string, string> = {
    // Math related
    'Math': 'SAT Math section including algebra, geometry, data analysis, etc.',
    'Advanced Math': 'Advanced Math',
    'Algebra': 'Algebra',
    'Heart of Algebra': 'Heart of Algebra',
    'Passport to Advanced Math': 'Passport to Advanced Math',
    'Problem-Solving and Data Analysis': 'Problem-Solving and Data Analysis',
    'Problem Solving and Data Analysis': 'Problem Solving and Data Analysis',
    'Geometry and Trigonometry': 'Geometry and Trigonometry',
    'Additional Topics in Math': 'Additional Topics in Math',
    
    // English related
    'English': 'SAT English section including reading, writing, grammar, etc.',
    'Reading': 'SAT reading comprehension and analysis',
    'Writing': 'SAT writing and language expression',
    'Grammar': 'SAT grammar and language usage',
    'Writing and Language': 'Writing and Language',
    'Craft and Structure': 'Craft and Structure',
    'Expression of Ideas': 'Expression of Ideas',
    'Information and Ideas': 'Information and Ideas',
    'Standard English Conventions': 'Standard English Conventions',
    
    // Practice tests
    'Practice Test': 'Complete SAT practice test questions',
    'Mock Test': 'Mock Test',
    'Full Test': 'Full Test'
  };
  
  return domainMap[domain] || domain; // If no mapping, return original value
};

/**
 * Get all available domain options (for dropdown selection)
 */
export const getDomainOptions = (): Array<{ value: string; label: string }> => {
  return [
    // Main categories
    { value: 'Math', label: 'SAT Math section including algebra, geometry, data analysis, etc.' },
    { value: 'English', label: 'SAT English section including reading, writing, grammar, etc.' },
    { value: 'Practice Test', label: 'Complete SAT practice test questions' },
    
    // Math subcategories
    { value: 'Algebra', label: 'Algebra' },
    { value: 'Advanced Math', label: 'Advanced Math' },
    { value: 'Heart of Algebra', label: 'Heart of Algebra' },
    { value: 'Passport to Advanced Math', label: 'Passport to Advanced Math' },
    { value: 'Problem-Solving and Data Analysis', label: 'Problem-Solving and Data Analysis' },
    { value: 'Geometry and Trigonometry', label: 'Geometry and Trigonometry' },
    { value: 'Additional Topics in Math', label: 'Additional Topics in Math' },
    
    // English subcategories
    { value: 'Reading', label: 'SAT reading comprehension and analysis' },
    { value: 'Writing', label: 'SAT writing and language expression' },
    { value: 'Grammar', label: 'SAT grammar and language usage' },
    { value: 'Writing and Language', label: 'Writing and Language' },
    { value: 'Craft and Structure', label: 'Craft and Structure' },
    { value: 'Expression of Ideas', label: 'Expression of Ideas' },
    { value: 'Information and Ideas', label: 'Information and Ideas' },
    { value: 'Standard English Conventions', label: 'Standard English Conventions' },
    
    // Others
    { value: 'Mock Test', label: 'Mock Test' },
    { value: 'Full Test', label: 'Full Test' }
  ];
};
