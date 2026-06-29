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
