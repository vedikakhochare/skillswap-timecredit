import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  increment,
  runTransaction
} from 'firebase/firestore';
import { db } from './firebase';

// Quiz Data Models
export interface Quiz {
  id?: string;
  title: string;
  description: string;
  skillId: string;
  skillName: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  questions: QuizQuestion[];
  timeLimit?: number; // in minutes
  totalCredits: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // AI or user ID
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // index of correct option
  explanation?: string;
  points: number;
  category?: string;
}

export interface QuizAttempt {
  id?: string;
  userId: string;
  quizId: string;
  answers: number[]; // user's answers (indices)
  score: number;
  totalQuestions: number;
  timeSpent: number; // in seconds
  creditsEarned: number;
  completedAt: Date;
  streakBonus?: number;
  accuracyBonus?: number;
}

export interface UserQuizStats {
  id?: string;
  userId: string;
  skillId: string;
  totalQuizzes: number;
  averageScore: number;
  bestScore: number;
  totalCreditsEarned: number;
  currentStreak: number;
  longestStreak: number;
  lastQuizDate?: Date;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  updatedAt: Date;
}

export interface Badge {
  id?: string;
  userId: string;
  badgeType: BadgeType;
  badgeName: string;
  description: string;
  icon: string;
  earnedAt: Date;
  skillId?: string;
}

export type BadgeType = 
  | 'first_quiz'
  | 'perfect_score'
  | 'streak_5'
  | 'streak_10'
  | 'streak_30'
  | 'skill_master'
  | 'quiz_enthusiast'
  | 'speed_demon'
  | 'accuracy_king'
  | 'dedicated_learner';

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  userAvatar?: string;
  totalCredits: number;
  totalQuizzes: number;
  averageScore: number;
  currentStreak: number;
  rank: number;
}

export interface SkillInsight {
  skillId: string;
  skillName: string;
  strengths: string[];
  weaknesses: string[];
  recommendedTopics: string[];
  progressTrend: 'improving' | 'stable' | 'declining';
  nextLevelTarget: number;
  studyRecommendations: string[];
}

// Enhanced AI Quiz Generation with exactly 5 questions per quiz
export const generateQuiz = async (
  skillId: string, 
  skillName: string, 
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  userId: string,
  questionCount: number = 5
): Promise<Quiz> => {
  // Generate exactly 5 questions with randomized difficulty distribution
  const questions = generateRandomizedQuestions(skillName, difficulty, 5);
  
  // Validate that we have questions
  if (questions.length === 0) {
    throw new Error(`No questions available for skill: ${skillName}. Please try a different skill.`);
  }
  
  console.log('Generated quiz with', questions.length, 'questions for', skillName);
  
  const quiz: Omit<Quiz, 'id'> = {
    title: `${skillName} Quiz - ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Level`,
    description: `Test your knowledge of ${skillName} with this ${difficulty} level quiz. 5 carefully selected questions.`,
    skillId,
    skillName,
    difficulty,
    questions,
    timeLimit: calculateTimeLimit(difficulty, 5),
    totalCredits: calculateQuizCredits(difficulty, 5),
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'ai'
  };

  const docRef = await addDoc(collection(db, 'quizzes'), quiz);
  return { id: docRef.id, ...quiz };
};

// Generate randomized questions with mixed difficulty levels
const generateRandomizedQuestions = (skillName: string, baseDifficulty: string, questionCount: number): QuizQuestion[] => {
  const allQuestions = generateAllQuestionsForSkill(skillName);
  
  console.log('Generating quiz for skill:', skillName, 'with', allQuestions.length, 'available questions');
  
  // If no questions available, return empty array
  if (allQuestions.length === 0) {
    console.warn('No questions available for skill:', skillName);
    return [];
  }
  
  // Create difficulty distribution based on base difficulty
  let difficultyDistribution: { [key: string]: number };
  
  switch (baseDifficulty) {
    case 'beginner':
      difficultyDistribution = { 'beginner': 0.6, 'intermediate': 0.3, 'advanced': 0.1 };
      break;
    case 'intermediate':
      difficultyDistribution = { 'beginner': 0.2, 'intermediate': 0.5, 'advanced': 0.3 };
      break;
    case 'advanced':
      difficultyDistribution = { 'beginner': 0.1, 'intermediate': 0.3, 'advanced': 0.6 };
      break;
    default:
      difficultyDistribution = { 'beginner': 0.4, 'intermediate': 0.4, 'advanced': 0.2 };
  }
  
  // Calculate questions per difficulty level
  const beginnerCount = Math.floor(questionCount * difficultyDistribution.beginner);
  const intermediateCount = Math.floor(questionCount * difficultyDistribution.intermediate);
  const advancedCount = questionCount - beginnerCount - intermediateCount;
  
  // Select questions from each difficulty level
  const selectedQuestions: QuizQuestion[] = [];
  
  if (beginnerCount > 0) {
    const beginnerQuestions = allQuestions.filter(q => q.difficulty === 'beginner');
    selectedQuestions.push(...getRandomQuestions(beginnerQuestions, beginnerCount));
  }
  
  if (intermediateCount > 0) {
    const intermediateQuestions = allQuestions.filter(q => q.difficulty === 'intermediate');
    selectedQuestions.push(...getRandomQuestions(intermediateQuestions, intermediateCount));
  }
  
  if (advancedCount > 0) {
    const advancedQuestions = allQuestions.filter(q => q.difficulty === 'advanced');
    selectedQuestions.push(...getRandomQuestions(advancedQuestions, advancedCount));
  }
  
  // Shuffle the final questions
  return shuffleArray(selectedQuestions);
};

// Get random questions from a pool
const getRandomQuestions = (questions: QuizQuestion[], count: number): QuizQuestion[] => {
  const shuffled = shuffleArray([...questions]);
  return shuffled.slice(0, Math.min(count, questions.length));
};

// Shuffle array using Fisher-Yates algorithm
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Calculate time limit based on difficulty and question count
const calculateTimeLimit = (difficulty: string, questionCount: number): number => {
  const baseTimePerQuestion = {
    'beginner': 1.5, // 1.5 minutes per question
    'intermediate': 2, // 2 minutes per question
    'advanced': 2.5 // 2.5 minutes per question
  };
  
  const timePerQuestion = baseTimePerQuestion[difficulty as keyof typeof baseTimePerQuestion] || 2;
  return Math.ceil(questionCount * timePerQuestion);
};

// Generate comprehensive questions for all skills
const generateAllQuestionsForSkill = (skillName: string): QuizQuestion[] => {
  const allQuestions = generateComprehensiveQuestions(skillName);
  return allQuestions;
};

// Generate comprehensive questions for trending programming languages and categories
const generateComprehensiveQuestions = (skillName: string): QuizQuestion[] => {
  const questionBank = {
    // Programming & Tech - JavaScript
    'JavaScript': [
      {
        question: "What is the correct way to declare a variable in JavaScript?",
        options: ["var name = 'John'", "variable name = 'John'", "v name = 'John'", "declare name = 'John'"],
        correctAnswer: 0,
        difficulty: 'beginner' as const,
        explanation: "var, let, and const are the correct ways to declare variables in JavaScript."
      },
      {
        question: "What is the difference between == and === in JavaScript?",
        options: ["No difference", "== checks value and type, === checks only value", "=== checks value and type, == checks only value", "Both check value and type"],
        correctAnswer: 2,
        difficulty: 'intermediate' as const,
        explanation: "=== performs strict equality checking (value and type), while == performs type coercion."
      },
      {
        question: "What is a closure in JavaScript?",
        options: ["A function that has access to variables in its outer scope", "A way to close a function", "A method to end a loop", "A type of variable"],
        correctAnswer: 0,
        difficulty: 'advanced' as const,
        explanation: "A closure is a function that has access to variables in its outer (enclosing) scope even after the outer function returns."
      },
      {
        question: "Which method is used to add an element to the end of an array?",
        options: ["push()", "pop()", "shift()", "unshift()"],
        correctAnswer: 0,
        difficulty: 'beginner' as const,
        explanation: "The push() method adds one or more elements to the end of an array."
      },
      {
        question: "What is the purpose of the 'this' keyword in JavaScript?",
        options: ["Refers to the current object", "Creates a new object", "Deletes an object", "Imports a module"],
        correctAnswer: 0,
        difficulty: 'intermediate' as const,
        explanation: "The 'this' keyword refers to the object that is currently executing the function."
      },
      {
        question: "What is the event loop in JavaScript?",
        options: ["A way to loop through events", "A mechanism that handles asynchronous operations", "A type of loop", "A debugging tool"],
        correctAnswer: 1,
        difficulty: 'advanced' as const,
        explanation: "The event loop is a mechanism that handles asynchronous operations by managing the call stack and callback queue."
      },
      {
        question: "What is hoisting in JavaScript?",
        options: ["Moving variables to the top", "A mechanism where variables and function declarations are moved to the top of their scope", "A type of function", "A debugging technique"],
        correctAnswer: 1,
        difficulty: 'intermediate' as const,
        explanation: "Hoisting is a JavaScript mechanism where variables and function declarations are moved to the top of their containing scope during compilation."
      },
      {
        question: "What is the difference between let and var?",
        options: ["No difference", "let has block scope, var has function scope", "var has block scope, let has function scope", "Both have the same scope"],
        correctAnswer: 1,
        difficulty: 'intermediate' as const,
        explanation: "let has block scope while var has function scope. let also doesn't allow redeclaration in the same scope."
      },
      {
        question: "What is a Promise in JavaScript?",
        options: ["A type of variable", "An object representing eventual completion of an asynchronous operation", "A function", "A loop"],
        correctAnswer: 1,
        difficulty: 'advanced' as const,
        explanation: "A Promise is an object representing the eventual completion or failure of an asynchronous operation."
      },
      {
        question: "What is the spread operator (...) used for?",
        options: ["To spread butter", "To expand arrays or objects", "To create loops", "To declare variables"],
        correctAnswer: 1,
        difficulty: 'intermediate' as const,
        explanation: "The spread operator (...) is used to expand arrays or objects into individual elements."
      }
    ],
    'Python': [
      {
        question: "What is the correct way to create a list in Python?",
        options: ["list = [1, 2, 3]", "list = (1, 2, 3)", "list = {1, 2, 3}", "list = 1, 2, 3"],
        correctAnswer: 0,
        difficulty: 'beginner' as const,
        explanation: "Lists in Python are created using square brackets []."
      },
      {
        question: "What is a list comprehension in Python?",
        options: ["A way to read lists", "A concise way to create lists", "A method to sort lists", "A way to delete list items"],
        correctAnswer: 1,
        difficulty: 'intermediate' as const,
        explanation: "List comprehensions provide a concise way to create lists based on existing lists."
      },
      {
        question: "What is the difference between a list and a tuple in Python?",
        options: ["No difference", "Lists are mutable, tuples are immutable", "Tuples are mutable, lists are immutable", "Both are immutable"],
        correctAnswer: 1,
        difficulty: 'advanced' as const,
        explanation: "Lists are mutable (can be changed), while tuples are immutable (cannot be changed)."
      },
      {
        question: "Which keyword is used to define a function in Python?",
        options: ["function", "def", "func", "define"],
        correctAnswer: 1,
        difficulty: 'beginner' as const,
        explanation: "The 'def' keyword is used to define functions in Python."
      },
      {
        question: "What is the purpose of __init__ in Python classes?",
        options: ["To initialize the class", "A constructor method that initializes new instances", "To destroy the class", "To import modules"],
        correctAnswer: 1,
        difficulty: 'intermediate' as const,
        explanation: "__init__ is a constructor method that is called when a new instance of a class is created."
      },
      {
        question: "What is a decorator in Python?",
        options: ["A type of variable", "A function that modifies another function", "A loop", "A data type"],
        correctAnswer: 1,
        difficulty: 'advanced' as const,
        explanation: "A decorator is a function that takes another function and extends or modifies its behavior."
      },
      {
        question: "What is the difference between == and is in Python?",
        options: ["No difference", "== compares values, is compares identity", "is compares values, == compares identity", "Both are the same"],
        correctAnswer: 1,
        difficulty: 'intermediate' as const,
        explanation: "== compares the values of objects, while 'is' compares the identity (memory location) of objects."
      },
      {
        question: "What is PEP 8 in Python?",
        options: ["A Python version", "A style guide for Python code", "A Python library", "A Python framework"],
        correctAnswer: 1,
        difficulty: 'intermediate' as const,
        explanation: "PEP 8 is the official style guide for Python code, providing conventions for writing readable code."
      },
      {
        question: "What is a generator in Python?",
        options: ["A type of function", "A function that returns an iterator", "A loop", "A variable"],
        correctAnswer: 1,
        difficulty: 'advanced' as const,
        explanation: "A generator is a function that returns an iterator object, allowing you to iterate over values one at a time."
      },
      {
        question: "What is the Global Interpreter Lock (GIL) in Python?",
        options: ["A security feature", "A mechanism that allows only one thread to execute Python bytecode at a time", "A debugging tool", "A performance optimization"],
        correctAnswer: 1,
        difficulty: 'advanced' as const,
        explanation: "The GIL is a mechanism that allows only one thread to execute Python bytecode at a time, even in multi-threaded programs."
      }
    ],
    'React': [
      {
        question: "What is JSX in React?",
        options: ["A JavaScript library", "A syntax extension for JavaScript", "A CSS framework", "A database"],
        correctAnswer: 1,
        difficulty: 'beginner' as const,
        explanation: "JSX is a syntax extension for JavaScript that allows you to write HTML-like code in JavaScript."
      },
      {
        question: "What is a React Hook?",
        options: ["A way to hang components", "Functions that let you use state and lifecycle features", "A type of component", "A styling method"],
        correctAnswer: 1,
        difficulty: 'intermediate' as const,
        explanation: "Hooks are functions that let you use state and other React features in functional components."
      },
      {
        question: "What is the purpose of useCallback in React?",
        options: ["To create callbacks", "To memoize functions to prevent unnecessary re-renders", "To handle clicks", "To manage state"],
        correctAnswer: 1,
        difficulty: 'advanced' as const,
        explanation: "useCallback returns a memoized version of the callback that only changes if one of the dependencies has changed."
      },
      {
        question: "Which hook is used to manage state in functional components?",
        options: ["useEffect", "useState", "useContext", "useReducer"],
        correctAnswer: 1,
        difficulty: 'beginner' as const,
        explanation: "useState is the hook used to manage state in functional components."
      },
      {
        question: "What is the purpose of useEffect in React?",
        options: ["To manage state", "To perform side effects in functional components", "To create components", "To handle events"],
        correctAnswer: 1,
        difficulty: 'intermediate' as const,
        explanation: "useEffect is used to perform side effects in functional components, such as data fetching or subscriptions."
      },
      {
        question: "What is the Virtual DOM in React?",
        options: ["A real DOM", "A JavaScript representation of the real DOM", "A database", "A server"],
        correctAnswer: 1,
        difficulty: 'intermediate' as const,
        explanation: "The Virtual DOM is a JavaScript representation of the real DOM that React uses to optimize updates."
      },
      {
        question: "What is the purpose of useMemo in React?",
        options: ["To create components", "To memoize expensive calculations", "To manage state", "To handle events"],
        correctAnswer: 1,
        difficulty: 'advanced' as const,
        explanation: "useMemo is used to memoize expensive calculations and only recalculate when dependencies change."
      },
      {
        question: "What is a Higher-Order Component (HOC) in React?",
        options: ["A type of hook", "A function that takes a component and returns a new component", "A state management tool", "A styling method"],
        correctAnswer: 1,
        difficulty: 'advanced' as const,
        explanation: "A HOC is a function that takes a component and returns a new component with additional functionality."
      },
      {
        question: "What is the purpose of React.memo?",
        options: ["To create components", "To prevent unnecessary re-renders of functional components", "To manage state", "To handle events"],
        correctAnswer: 1,
        difficulty: 'advanced' as const,
        explanation: "React.memo is a higher-order component that prevents unnecessary re-renders by memoizing the component."
      },
      {
        question: "What is the difference between controlled and uncontrolled components?",
        options: ["No difference", "Controlled components have their state managed by React, uncontrolled components manage their own state", "Uncontrolled components have their state managed by React, controlled components manage their own state", "Both are the same"],
        correctAnswer: 1,
        difficulty: 'intermediate' as const,
        explanation: "Controlled components have their state managed by React through props, while uncontrolled components manage their own state internally."
      }
    ],
    'TypeScript': [
      {
        question: "What is TypeScript?",
        options: ["A JavaScript framework", "A superset of JavaScript with static types", "A CSS preprocessor", "A database language"],
        correctAnswer: 1,
        difficulty: 'beginner' as const,
        explanation: "TypeScript is a programming language developed by Microsoft that is a superset of JavaScript with static type definitions."
      },
      {
        question: "How do you define a type in TypeScript?",
        options: ["type MyType = string", "MyType = string", "define MyType as string", "MyType: string"],
        correctAnswer: 0,
        difficulty: 'intermediate' as const,
        explanation: "Types in TypeScript are defined using the 'type' keyword followed by the type name and definition."
      },
      {
        question: "What is a generic in TypeScript?",
        options: ["A specific type", "A way to create reusable components that work with multiple types", "A function", "A variable"],
        correctAnswer: 1,
        difficulty: 'advanced' as const,
        explanation: "Generics allow you to create reusable components that work with multiple types while maintaining type safety."
      },
      {
        question: "What is the purpose of interfaces in TypeScript?",
        options: ["To create objects", "To define the structure of objects", "To create functions", "To manage state"],
        correctAnswer: 1,
        difficulty: 'intermediate' as const,
        explanation: "Interfaces in TypeScript define the structure and shape of objects, ensuring type safety."
      },
      {
        question: "What is the difference between 'any' and 'unknown' in TypeScript?",
        options: ["No difference", "any disables type checking, unknown requires type checking", "unknown disables type checking, any requires type checking", "Both are the same"],
        correctAnswer: 1,
        difficulty: 'advanced' as const,
        explanation: "any disables type checking completely, while unknown requires type checking before use."
      },
      {
        question: "What is a union type in TypeScript?",
        options: ["A type that combines multiple types", "A single type", "A function", "A variable"],
        correctAnswer: 0,
        difficulty: 'intermediate' as const,
        explanation: "A union type allows a variable to be one of several types, defined with the | operator."
      },
      {
        question: "What is the purpose of enums in TypeScript?",
        options: ["To create objects", "To define a set of named constants", "To create functions", "To manage state"],
        correctAnswer: 1,
        difficulty: 'intermediate' as const,
        explanation: "Enums in TypeScript define a set of named constants, making code more readable and maintainable."
      },
      {
        question: "What is type assertion in TypeScript?",
        options: ["Creating new types", "Telling the compiler about the type of a value", "Deleting types", "Importing types"],
        correctAnswer: 1,
        difficulty: 'advanced' as const,
        explanation: "Type assertion tells the TypeScript compiler about the type of a value, using 'as' or angle bracket syntax."
      },
      {
        question: "What is the purpose of readonly in TypeScript?",
        options: ["To create variables", "To make properties immutable", "To delete properties", "To import modules"],
        correctAnswer: 1,
        difficulty: 'intermediate' as const,
        explanation: "The readonly modifier makes properties immutable, preventing them from being modified after initialization."
      },
      {
        question: "What is a mapped type in TypeScript?",
        options: ["A type that maps values", "A type that transforms existing types", "A function", "A variable"],
        correctAnswer: 1,
        difficulty: 'advanced' as const,
        explanation: "Mapped types transform existing types by applying transformations to all properties of the type."
      }
    ],
    'Java': [
      {
        question: "What is the main method signature in Java?",
        options: ["public static void main(String[] args)", "public void main(String[] args)", "static void main(String[] args)", "void main(String[] args)"],
        correctAnswer: 0,
        difficulty: 'beginner' as const,
        explanation: "The main method in Java must be public, static, void, and take a String array parameter."
      },
      {
        question: "What is inheritance in Java?",
        options: ["A way to create objects", "A mechanism where a class acquires properties from another class", "A type of loop", "A method"],
        correctAnswer: 1,
        difficulty: 'intermediate' as const,
        explanation: "Inheritance allows a class to acquire properties and methods from another class using the 'extends' keyword."
      },
      {
        question: "What is polymorphism in Java?",
        options: ["A type of variable", "The ability of an object to take many forms", "A loop", "A method"],
        correctAnswer: 1,
        difficulty: 'advanced' as const,
        explanation: "Polymorphism allows objects of different types to be treated as objects of a common base type."
      },
      {
        question: "What is the difference between == and .equals() in Java?",
        options: ["No difference", "== compares references, .equals() compares values", ".equals() compares references, == compares values", "Both are the same"],
        correctAnswer: 1,
        difficulty: 'intermediate' as const,
        explanation: "== compares object references, while .equals() compares the actual values of objects."
      },
      {
        question: "What is an interface in Java?",
        options: ["A class", "A contract that defines methods a class must implement", "A variable", "A loop"],
        correctAnswer: 1,
        difficulty: 'intermediate' as const,
        explanation: "An interface in Java defines a contract of methods that implementing classes must provide."
      },
      {
        question: "What is the purpose of the 'final' keyword in Java?",
        options: ["To create variables", "To make variables, methods, or classes immutable", "To delete code", "To import modules"],
        correctAnswer: 1,
        difficulty: 'intermediate' as const,
        explanation: "The 'final' keyword makes variables immutable, methods non-overridable, or classes non-inheritable."
      },
      {
        question: "What is a constructor in Java?",
        options: ["A method", "A special method used to initialize objects", "A variable", "A loop"],
        correctAnswer: 1,
        difficulty: 'beginner' as const,
        explanation: "A constructor is a special method that is called when an object is created to initialize its state."
      },
      {
        question: "What is the difference between ArrayList and LinkedList in Java?",
        options: ["No difference", "ArrayList uses arrays, LinkedList uses nodes", "LinkedList uses arrays, ArrayList uses nodes", "Both are the same"],
        correctAnswer: 1,
        difficulty: 'advanced' as const,
        explanation: "ArrayList uses dynamic arrays for storage, while LinkedList uses doubly-linked nodes."
      },
      {
        question: "What is exception handling in Java?",
        options: ["A type of loop", "A mechanism to handle runtime errors", "A variable", "A method"],
        correctAnswer: 1,
        difficulty: 'intermediate' as const,
        explanation: "Exception handling in Java allows programs to handle runtime errors gracefully using try-catch blocks."
      },
      {
        question: "What is the purpose of the 'static' keyword in Java?",
        options: ["To create objects", "To make members belong to the class rather than instances", "To delete code", "To import modules"],
        correctAnswer: 1,
        difficulty: 'intermediate' as const,
        explanation: "The 'static' keyword makes variables and methods belong to the class rather than to instances of the class."
      }
    ],
    'C++': [
      {
        question: "What is the difference between C and C++?",
        options: ["No difference", "C++ is object-oriented, C is procedural", "C is object-oriented, C++ is procedural", "Both are the same"],
        correctAnswer: 1,
        difficulty: 'beginner' as const,
        explanation: "C++ is an object-oriented programming language, while C is a procedural programming language."
      },
      {
        question: "What is a pointer in C++?",
        options: ["A type of variable", "A variable that stores the memory address of another variable", "A function", "A loop"],
        correctAnswer: 1,
        difficulty: 'intermediate' as const,
        explanation: "A pointer is a variable that stores the memory address of another variable."
      },
      {
        question: "What is the purpose of the 'new' operator in C++?",
        options: ["To create variables", "To dynamically allocate memory", "To delete memory", "To import modules"],
        correctAnswer: 1,
        difficulty: 'intermediate' as const,
        explanation: "The 'new' operator is used to dynamically allocate memory for objects at runtime."
      },
      {
        question: "What is a destructor in C++?",
        options: ["A constructor", "A special member function that cleans up when an object is destroyed", "A variable", "A loop"],
        correctAnswer: 1,
        difficulty: 'advanced' as const,
        explanation: "A destructor is a special member function that is called when an object is destroyed to clean up resources."
      },
      {
        question: "What is the difference between pass by value and pass by reference in C++?",
        options: ["No difference", "Pass by value copies the value, pass by reference passes the address", "Pass by reference copies the value, pass by value passes the address", "Both are the same"],
        correctAnswer: 1,
        difficulty: 'intermediate' as const,
        explanation: "Pass by value creates a copy of the argument, while pass by reference passes the actual variable."
      },
      {
        question: "What is operator overloading in C++?",
        options: ["A type of variable", "The ability to redefine how operators work with user-defined types", "A function", "A loop"],
        correctAnswer: 1,
        difficulty: 'advanced' as const,
        explanation: "Operator overloading allows you to redefine how operators work with user-defined types."
      },
      {
        question: "What is a template in C++?",
        options: ["A type of variable", "A blueprint for creating generic functions or classes", "A function", "A loop"],
        correctAnswer: 1,
        difficulty: 'advanced' as const,
        explanation: "Templates in C++ allow you to write generic code that works with different data types."
      },
      {
        question: "What is the purpose of the 'const' keyword in C++?",
        options: ["To create variables", "To make variables immutable", "To delete code", "To import modules"],
        correctAnswer: 1,
        difficulty: 'intermediate' as const,
        explanation: "The 'const' keyword makes variables immutable, preventing them from being modified after initialization."
      },
      {
        question: "What is a virtual function in C++?",
        options: ["A regular function", "A function that can be overridden in derived classes", "A variable", "A loop"],
        correctAnswer: 1,
        difficulty: 'advanced' as const,
        explanation: "A virtual function is a function that can be overridden in derived classes and is resolved at runtime."
      },
      {
        question: "What is the difference between stack and heap memory in C++?",
        options: ["No difference", "Stack is automatic, heap is manual", "Heap is automatic, stack is manual", "Both are the same"],
        correctAnswer: 1,
        difficulty: 'advanced' as const,
        explanation: "Stack memory is automatically managed, while heap memory must be manually allocated and deallocated."
      }
    ],
    'AI/ML': [
      {
        question: "What is Machine Learning?",
        options: ["A type of computer", "A subset of AI that enables computers to learn without being explicitly programmed", "A programming language", "A database system"],
        correctAnswer: 1,
        difficulty: 'beginner' as const,
        explanation: "Machine Learning is a subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed."
      },
      {
        question: "What is the difference between supervised and unsupervised learning?",
        options: ["No difference", "Supervised uses labeled data, unsupervised doesn't", "Unsupervised uses labeled data, supervised doesn't", "Both use labeled data"],
        correctAnswer: 1,
        difficulty: 'intermediate' as const,
        explanation: "Supervised learning uses labeled training data, while unsupervised learning finds patterns in data without labels."
      },
      {
        question: "What is overfitting in machine learning?",
        options: ["When a model performs well on training data but poorly on new data", "When a model is too simple", "When a model is too fast", "When a model is too slow"],
        correctAnswer: 0,
        difficulty: 'advanced' as const,
        explanation: "Overfitting occurs when a model learns the training data too well, including noise, and performs poorly on new, unseen data."
      },
      {
        question: "What is a neural network?",
        options: ["A type of computer", "A computing system inspired by biological neural networks", "A database", "A programming language"],
        correctAnswer: 1,
        difficulty: 'intermediate' as const,
        explanation: "A neural network is a computing system inspired by biological neural networks that can learn to perform tasks."
      },
      {
        question: "What is deep learning?",
        options: ["A type of machine learning", "A subset of machine learning using neural networks with multiple layers", "A programming language", "A database system"],
        correctAnswer: 1,
        difficulty: 'intermediate' as const,
        explanation: "Deep learning is a subset of machine learning that uses neural networks with multiple layers to learn complex patterns."
      },
      {
        question: "What is the purpose of training data in machine learning?",
        options: ["To test models", "To teach models how to make predictions", "To store data", "To delete data"],
        correctAnswer: 1,
        difficulty: 'beginner' as const,
        explanation: "Training data is used to teach machine learning models how to make predictions by learning patterns from examples."
      },
      {
        question: "What is cross-validation in machine learning?",
        options: ["A type of model", "A technique to assess model performance by splitting data into training and testing sets", "A programming language", "A database"],
        correctAnswer: 1,
        difficulty: 'advanced' as const,
        explanation: "Cross-validation is a technique to assess model performance by splitting data into multiple training and testing sets."
      },
      {
        question: "What is the difference between classification and regression?",
        options: ["No difference", "Classification predicts categories, regression predicts continuous values", "Regression predicts categories, classification predicts continuous values", "Both are the same"],
        correctAnswer: 1,
        difficulty: 'intermediate' as const,
        explanation: "Classification predicts discrete categories, while regression predicts continuous numerical values."
      },
      {
        question: "What is feature engineering in machine learning?",
        options: ["A type of model", "The process of selecting and transforming input variables", "A programming language", "A database"],
        correctAnswer: 1,
        difficulty: 'advanced' as const,
        explanation: "Feature engineering is the process of selecting and transforming input variables to improve model performance."
      },
      {
        question: "What is the purpose of regularization in machine learning?",
        options: ["To speed up training", "To prevent overfitting by adding penalty terms", "To create models", "To delete data"],
        correctAnswer: 1,
        difficulty: 'advanced' as const,
        explanation: "Regularization prevents overfitting by adding penalty terms to the model's cost function."
      }
    ],
    'Go': [
      {
        question: "What is Go (Golang)?",
        options: ["A database", "A programming language developed by Google", "A framework", "A library"],
        correctAnswer: 1,
        difficulty: 'beginner' as const,
        explanation: "Go is a programming language developed by Google, known for its simplicity and efficiency."
      },
      {
        question: "What is a goroutine in Go?",
        options: ["A type of variable", "A lightweight thread managed by the Go runtime", "A function", "A loop"],
        correctAnswer: 1,
        difficulty: 'intermediate' as const,
        explanation: "A goroutine is a lightweight thread managed by the Go runtime, allowing concurrent execution."
      },
      {
        question: "What is a channel in Go?",
        options: ["A type of variable", "A communication mechanism between goroutines", "A function", "A loop"],
        correctAnswer: 1,
        difficulty: 'intermediate' as const,
        explanation: "A channel is a communication mechanism that allows goroutines to send and receive data."
      },
      {
        question: "What is the purpose of the 'defer' keyword in Go?",
        options: ["To create variables", "To schedule a function call to run when the surrounding function returns", "To delete code", "To import modules"],
        correctAnswer: 1,
        difficulty: 'intermediate' as const,
        explanation: "The 'defer' keyword schedules a function call to run when the surrounding function returns."
      },
      {
        question: "What is the difference between slices and arrays in Go?",
        options: ["No difference", "Slices are dynamic, arrays have fixed size", "Arrays are dynamic, slices have fixed size", "Both are the same"],
        correctAnswer: 1,
        difficulty: 'intermediate' as const,
        explanation: "Slices are dynamic and can grow/shrink, while arrays have a fixed size determined at compile time."
      },
      {
        question: "What is an interface in Go?",
        options: ["A class", "A type that defines a set of method signatures", "A variable", "A loop"],
        correctAnswer: 1,
        difficulty: 'intermediate' as const,
        explanation: "An interface in Go defines a set of method signatures that types must implement."
      },
      {
        question: "What is the purpose of the 'go' keyword in Go?",
        options: ["To create variables", "To start a new goroutine", "To delete code", "To import modules"],
        correctAnswer: 1,
        difficulty: 'beginner' as const,
        explanation: "The 'go' keyword is used to start a new goroutine, enabling concurrent execution."
      },
      {
        question: "What is the difference between 'make' and 'new' in Go?",
        options: ["No difference", "make creates and initializes, new only allocates", "new creates and initializes, make only allocates", "Both are the same"],
        correctAnswer: 1,
        difficulty: 'advanced' as const,
        explanation: "make creates and initializes slices, maps, and channels, while new only allocates memory and returns a pointer."
      },
      {
        question: "What is a pointer in Go?",
        options: ["A type of variable", "A variable that stores the memory address of another variable", "A function", "A loop"],
        correctAnswer: 1,
        difficulty: 'intermediate' as const,
        explanation: "A pointer in Go stores the memory address of another variable, allowing indirect access to its value."
      },
      {
        question: "What is the purpose of the 'range' keyword in Go?",
        options: ["To create variables", "To iterate over arrays, slices, maps, and channels", "To delete code", "To import modules"],
        correctAnswer: 1,
        difficulty: 'intermediate' as const,
        explanation: "The 'range' keyword is used to iterate over arrays, slices, maps, and channels in Go."
      }
    ],
    'Rust': [
      {
        question: "What is Rust?",
        options: ["A database", "A systems programming language focused on safety and performance", "A framework", "A library"],
        correctAnswer: 1,
        difficulty: 'beginner' as const,
        explanation: "Rust is a systems programming language that focuses on memory safety and performance."
      },
      {
        question: "What is ownership in Rust?",
        options: ["A type of variable", "A memory management system where each value has a single owner", "A function", "A loop"],
        correctAnswer: 1,
        difficulty: 'intermediate' as const,
        explanation: "Ownership is Rust's memory management system where each value has a single owner responsible for cleaning it up."
      },
      {
        question: "What is borrowing in Rust?",
        options: ["A type of variable", "A mechanism to reference data without taking ownership", "A function", "A loop"],
        correctAnswer: 1,
        difficulty: 'intermediate' as const,
        explanation: "Borrowing allows you to reference data without taking ownership, enabling safe concurrent access."
      },
      {
        question: "What is the difference between 'let' and 'let mut' in Rust?",
        options: ["No difference", "let creates immutable bindings, let mut creates mutable bindings", "let mut creates immutable bindings, let creates mutable bindings", "Both are the same"],
        correctAnswer: 1,
        difficulty: 'beginner' as const,
        explanation: "let creates immutable bindings, while let mut creates mutable bindings that can be modified."
      },
      {
        question: "What is a trait in Rust?",
        options: ["A type of variable", "A collection of methods that types can implement", "A function", "A loop"],
        correctAnswer: 1,
        difficulty: 'intermediate' as const,
        explanation: "A trait in Rust defines a collection of methods that types can implement, similar to interfaces in other languages."
      },
      {
        question: "What is the purpose of the 'match' keyword in Rust?",
        options: ["To create variables", "To perform pattern matching and control flow", "To delete code", "To import modules"],
        correctAnswer: 1,
        difficulty: 'intermediate' as const,
        explanation: "The 'match' keyword is used for pattern matching and control flow in Rust, similar to switch statements."
      },
      {
        question: "What is the difference between 'String' and '&str' in Rust?",
        options: ["No difference", "String is owned, &str is borrowed", "&str is owned, String is borrowed", "Both are the same"],
        correctAnswer: 1,
        difficulty: 'advanced' as const,
        explanation: "String is an owned string type, while &str is a borrowed string slice."
      },
      {
        question: "What is the purpose of the 'Result' type in Rust?",
        options: ["To create variables", "To handle errors and success cases", "To delete code", "To import modules"],
        correctAnswer: 1,
        difficulty: 'intermediate' as const,
        explanation: "The Result type is used to handle operations that can either succeed (Ok) or fail (Err)."
      },
      {
        question: "What is the purpose of the 'Option' type in Rust?",
        options: ["To create variables", "To represent values that might or might not exist", "To delete code", "To import modules"],
        correctAnswer: 1,
        difficulty: 'intermediate' as const,
        explanation: "The Option type represents values that might or might not exist, with Some(value) or None."
      },
      {
        question: "What is the purpose of the 'unsafe' keyword in Rust?",
        options: ["To create variables", "To bypass Rust's safety guarantees for low-level operations", "To delete code", "To import modules"],
        correctAnswer: 1,
        difficulty: 'advanced' as const,
        explanation: "The 'unsafe' keyword allows you to bypass Rust's safety guarantees for low-level operations."
      }
    ],
    'Swift': [
      {
        question: "What is Swift?",
        options: ["A database", "A programming language developed by Apple", "A framework", "A library"],
        correctAnswer: 1,
        difficulty: 'beginner' as const,
        explanation: "Swift is a programming language developed by Apple for iOS, macOS, watchOS, and tvOS development."
      },
      {
        question: "What is an optional in Swift?",
        options: ["A type of variable", "A type that represents either a value or nil", "A function", "A loop"],
        correctAnswer: 1,
        difficulty: 'intermediate' as const,
        explanation: "An optional in Swift represents either a value or nil, providing type safety for potentially missing values."
      },
      {
        question: "What is the purpose of 'guard' statements in Swift?",
        options: ["To create variables", "To provide early exit from functions when conditions aren't met", "To delete code", "To import modules"],
        correctAnswer: 1,
        difficulty: 'intermediate' as const,
        explanation: "Guard statements provide early exit from functions when conditions aren't met, improving code readability."
      },
      {
        question: "What is the difference between 'let' and 'var' in Swift?",
        options: ["No difference", "let creates constants, var creates variables", "var creates constants, let creates variables", "Both are the same"],
        correctAnswer: 1,
        difficulty: 'beginner' as const,
        explanation: "let creates immutable constants, while var creates mutable variables."
      },
      {
        question: "What is a protocol in Swift?",
        options: ["A type of variable", "A blueprint that defines methods and properties", "A function", "A loop"],
        correctAnswer: 1,
        difficulty: 'intermediate' as const,
        explanation: "A protocol in Swift defines a blueprint of methods and properties that types can adopt."
      },
      {
        question: "What is the purpose of 'defer' in Swift?",
        options: ["To create variables", "To schedule code to run when the current scope exits", "To delete code", "To import modules"],
        correctAnswer: 1,
        difficulty: 'intermediate' as const,
        explanation: "defer schedules code to run when the current scope exits, useful for cleanup operations."
      },
      {
        question: "What is the difference between 'class' and 'struct' in Swift?",
        options: ["No difference", "class is reference type, struct is value type", "struct is reference type, class is value type", "Both are the same"],
        correctAnswer: 1,
        difficulty: 'advanced' as const,
        explanation: "class is a reference type (shared), while struct is a value type (copied)."
      },
      {
        question: "What is the purpose of 'extension' in Swift?",
        options: ["To create variables", "To add functionality to existing types", "To delete code", "To import modules"],
        correctAnswer: 1,
        difficulty: 'intermediate' as const,
        explanation: "Extensions allow you to add functionality to existing types without modifying their original definition."
      },
      {
        question: "What is the purpose of 'enum' in Swift?",
        options: ["To create variables", "To define a group of related values", "To delete code", "To import modules"],
        correctAnswer: 1,
        difficulty: 'intermediate' as const,
        explanation: "Enums in Swift define a group of related values, providing type safety and clarity."
      },
      {
        question: "What is the purpose of 'closure' in Swift?",
        options: ["To create variables", "To create self-contained blocks of functionality", "To delete code", "To import modules"],
        correctAnswer: 1,
        difficulty: 'intermediate' as const,
        explanation: "Closures in Swift are self-contained blocks of functionality that can be passed around and used in your code."
      }
    ],
    'Blockchain': [
      {
        question: "What is a blockchain?",
        options: ["A type of database", "A distributed ledger technology", "A programming language", "A type of computer"],
        correctAnswer: 1,
        difficulty: 'beginner' as const,
        explanation: "Blockchain is a distributed ledger technology that maintains a continuously growing list of records (blocks) linked and secured using cryptography."
      },
      {
        question: "What is a smart contract?",
        options: ["A legal document", "Self-executing contracts with terms directly written into code", "A type of cryptocurrency", "A blockchain protocol"],
        correctAnswer: 1,
        difficulty: 'intermediate' as const,
        explanation: "Smart contracts are self-executing contracts with the terms of the agreement directly written into lines of code."
      },
      {
        question: "What is the difference between Bitcoin and Ethereum?",
        options: ["No difference", "Bitcoin is a cryptocurrency, Ethereum is a platform for smart contracts", "Ethereum is a cryptocurrency, Bitcoin is a platform", "Both are the same"],
        correctAnswer: 1,
        difficulty: 'advanced' as const,
        explanation: "Bitcoin is primarily a cryptocurrency, while Ethereum is a platform that supports cryptocurrency (Ether) and smart contracts."
      }
    ],
    // Music & Arts
    'Music Theory': [
      {
        question: "What is a major scale?",
        options: ["A scale with 8 notes", "A scale following the pattern W-W-H-W-W-W-H", "A scale with only white keys", "A scale with 7 notes"],
        correctAnswer: 1,
        difficulty: 'beginner' as const,
        explanation: "A major scale follows the pattern: Whole-Whole-Half-Whole-Whole-Whole-Half steps."
      },
      {
        question: "What is a chord progression?",
        options: ["A sequence of chords", "A single chord", "A type of instrument", "A musical note"],
        correctAnswer: 0,
        difficulty: 'intermediate' as const,
        explanation: "A chord progression is a sequence of chords that provides the harmonic foundation of a piece of music."
      },
      {
        question: "What is the circle of fifths?",
        options: ["A geometric representation of relationships between keys", "A type of chord", "A musical instrument", "A scale pattern"],
        correctAnswer: 0,
        difficulty: 'advanced' as const,
        explanation: "The circle of fifths is a geometric representation of the relationships between the 12 tones of the chromatic scale."
      }
    ],
    // Finance & Entrepreneurship
    'Startups': [
      {
        question: "What is a startup?",
        options: ["A small business", "A newly established business with high growth potential", "A type of investment", "A company name"],
        correctAnswer: 1,
        difficulty: 'beginner' as const,
        explanation: "A startup is a newly established business, typically with high growth potential and innovative ideas."
      },
      {
        question: "What is a pitch deck?",
        options: ["A type of presentation", "A presentation used to sell an idea to investors", "A business plan", "A financial statement"],
        correctAnswer: 1,
        difficulty: 'intermediate' as const,
        explanation: "A pitch deck is a presentation used to sell an idea, product, or business to potential investors."
      },
      {
        question: "What is the difference between equity and debt financing?",
        options: ["No difference", "Equity gives ownership, debt is a loan", "Debt gives ownership, equity is a loan", "Both are the same"],
        correctAnswer: 1,
        difficulty: 'advanced' as const,
        explanation: "Equity financing involves selling ownership shares, while debt financing involves borrowing money that must be repaid."
      }
    ],
    // Science & General Knowledge
    'Physics': [
      {
        question: "What is Newton's First Law?",
        options: ["F = ma", "An object at rest stays at rest", "Every action has an equal and opposite reaction", "Energy cannot be created or destroyed"],
        correctAnswer: 1,
        difficulty: 'beginner' as const,
        explanation: "Newton's First Law states that an object at rest stays at rest, and an object in motion stays in motion, unless acted upon by an external force."
      },
      {
        question: "What is the speed of light?",
        options: ["300,000 km/s", "3,000,000 km/s", "30,000 km/s", "3,000 km/s"],
        correctAnswer: 0,
        difficulty: 'intermediate' as const,
        explanation: "The speed of light in a vacuum is approximately 299,792,458 meters per second, or about 300,000 km/s."
      },
      {
        question: "What is quantum entanglement?",
        options: ["A type of chemical bond", "A phenomenon where particles become interconnected", "A type of energy", "A measurement unit"],
        correctAnswer: 1,
        difficulty: 'advanced' as const,
        explanation: "Quantum entanglement is a phenomenon where particles become interconnected and the state of one particle instantly influences the state of another."
      }
    ],
    // Lifestyle & Health
    'Nutrition': [
      {
        question: "What are macronutrients?",
        options: ["Small nutrients", "Nutrients needed in large amounts", "Vitamins only", "Minerals only"],
        correctAnswer: 1,
        difficulty: 'beginner' as const,
        explanation: "Macronutrients are nutrients that the body needs in large amounts: carbohydrates, proteins, and fats."
      },
      {
        question: "What is the recommended daily water intake?",
        options: ["2 liters", "8 glasses", "Depends on individual needs", "1 gallon"],
        correctAnswer: 2,
        difficulty: 'intermediate' as const,
        explanation: "Water intake varies based on individual factors like age, weight, activity level, and climate."
      },
      {
        question: "What is the glycemic index?",
        options: ["A measure of food sweetness", "A measure of how quickly foods raise blood sugar", "A calorie count", "A vitamin content measure"],
        correctAnswer: 1,
        difficulty: 'advanced' as const,
        explanation: "The glycemic index measures how quickly foods raise blood sugar levels compared to pure glucose."
      }
    ],
    // Trending Topics
    'AI Trends': [
      {
        question: "What is ChatGPT?",
        options: ["A type of computer", "An AI language model", "A programming language", "A database"],
        correctAnswer: 1,
        difficulty: 'beginner' as const,
        explanation: "ChatGPT is an AI language model developed by OpenAI that can generate human-like text responses."
      },
      {
        question: "What is machine learning bias?",
        options: ["A type of error", "Systematic prejudice in AI systems", "A learning method", "A data type"],
        correctAnswer: 1,
        difficulty: 'intermediate' as const,
        explanation: "Machine learning bias refers to systematic prejudice in AI systems that can lead to unfair outcomes."
      },
      {
        question: "What is the difference between AGI and ANI?",
        options: ["No difference", "AGI is general intelligence, ANI is narrow intelligence", "ANI is general intelligence, AGI is narrow intelligence", "Both are the same"],
        correctAnswer: 1,
        difficulty: 'advanced' as const,
        explanation: "AGI (Artificial General Intelligence) can perform any intellectual task, while ANI (Artificial Narrow Intelligence) is designed for specific tasks."
      }
    ]
  };

  const questions = questionBank[skillName as keyof typeof questionBank] || [];
  
  // If no questions found for the specific skill, try to find similar skills or provide default questions
  if (questions.length === 0) {
    // Try to find a similar skill name (case-insensitive)
    const similarSkill = Object.keys(questionBank).find(key => 
      key.toLowerCase().includes(skillName.toLowerCase()) || 
      skillName.toLowerCase().includes(key.toLowerCase())
    );
    
    if (similarSkill) {
      return questionBank[similarSkill as keyof typeof questionBank] || [];
    }
    
    // If still no questions, return a default set of general knowledge questions
    return [
      {
        question: "What is the primary purpose of version control systems?",
        options: ["To store files", "To track changes in code over time", "To compile code", "To debug applications"],
        correctAnswer: 1,
        difficulty: 'beginner' as const,
        explanation: "Version control systems help track changes in code over time, allowing developers to manage different versions of their projects."
      },
      {
        question: "What does API stand for?",
        options: ["Application Programming Interface", "Advanced Programming Interface", "Application Process Integration", "Advanced Process Integration"],
        correctAnswer: 0,
        difficulty: 'beginner' as const,
        explanation: "API stands for Application Programming Interface, which allows different software applications to communicate with each other."
      }
    ];
  }
  
  return questions;
};

// Mock question generation
const generateMockQuestions = (skillName: string, difficulty: string): QuizQuestion[] => {
  const baseQuestions = {
    'JavaScript': [
      {
        question: "What is the correct way to declare a variable in JavaScript?",
        options: ["var name = 'John'", "variable name = 'John'", "v name = 'John'", "declare name = 'John'"],
        correctAnswer: 0,
        explanation: "The 'var' keyword is used to declare variables in JavaScript.",
        points: 10
      },
      {
        question: "Which method is used to add an element to the end of an array?",
        options: ["push()", "pop()", "shift()", "unshift()"],
        correctAnswer: 0,
        explanation: "The push() method adds one or more elements to the end of an array.",
        points: 10
      }
    ],
    'Python': [
      {
        question: "What is the correct syntax to create a list in Python?",
        options: ["list = [1, 2, 3]", "list = (1, 2, 3)", "list = {1, 2, 3}", "list = <1, 2, 3>"],
        correctAnswer: 0,
        explanation: "Lists in Python are created using square brackets [].",
        points: 10
      },
      {
        question: "Which keyword is used to define a function in Python?",
        options: ["function", "def", "func", "define"],
        correctAnswer: 1,
        explanation: "The 'def' keyword is used to define functions in Python.",
        points: 10
      }
    ],
    'React': [
      {
        question: "What is JSX in React?",
        options: ["A JavaScript library", "A syntax extension for JavaScript", "A CSS framework", "A database"],
        correctAnswer: 1,
        explanation: "JSX is a syntax extension for JavaScript that allows you to write HTML-like code in React.",
        points: 10
      },
      {
        question: "Which hook is used to manage state in functional components?",
        options: ["useEffect", "useState", "useContext", "useReducer"],
        correctAnswer: 1,
        explanation: "useState is the hook used to manage state in functional components.",
        points: 10
      }
    ]
  };

  const skillQuestions = baseQuestions[skillName as keyof typeof baseQuestions] || baseQuestions['JavaScript'];
  
  // Return 5-8 questions based on difficulty
  const questionCount = difficulty === 'beginner' ? 5 : difficulty === 'intermediate' ? 6 : 8;
  return skillQuestions.slice(0, questionCount).map((q, index) => ({
    id: `q${index + 1}`,
    ...q
  }));
};

const calculateQuizCredits = (difficulty: string, questionCount: number): number => {
  const baseCredits = questionCount * 2;
  const difficultyMultiplier = difficulty === 'beginner' ? 1 : difficulty === 'intermediate' ? 1.5 : 2;
  return Math.round(baseCredits * difficultyMultiplier);
};

// Quiz Attempt Management
export const submitQuizAttempt = async (attempt: Omit<QuizAttempt, 'id' | 'completedAt'>): Promise<string> => {
  const now = new Date();
  const attemptData: Omit<QuizAttempt, 'id'> = {
    ...attempt,
    completedAt: now
  };

  const docRef = await addDoc(collection(db, 'quizAttempts'), attemptData);
  
  // Update user stats and award credits
  await updateUserQuizStats(attempt.userId, attempt.quizId, attempt.score, attempt.creditsEarned);
  
  // Check for badges
  await checkAndAwardBadges(attempt.userId, attempt.quizId, attempt.score);
  
  return docRef.id;
};

// Update user quiz statistics
const updateUserQuizStats = async (
  userId: string, 
  quizId: string, 
  score: number, 
  creditsEarned: number
): Promise<void> => {
  const statsRef = doc(db, 'userQuizStats', `${userId}_${quizId.split('_')[0]}`); // Assuming skillId is part of quizId
  const userRef = doc(db, 'users', userId);
  
  await runTransaction(db, async (transaction) => {
    const statsDoc = await transaction.get(statsRef);
    const userDoc = await transaction.get(userRef);
    
    // Update user's total credits
    if (userDoc.exists()) {
      const currentCredits = userDoc.data().credits || 0;
      transaction.update(userRef, {
        credits: currentCredits + creditsEarned,
        updatedAt: new Date()
      });
    }
    
    if (statsDoc.exists()) {
      const currentStats = statsDoc.data() as UserQuizStats;
      const newTotalQuizzes = currentStats.totalQuizzes + 1;
      const newAverageScore = ((currentStats.averageScore * currentStats.totalQuizzes) + score) / newTotalQuizzes;
      const newBestScore = Math.max(currentStats.bestScore, score);
      const newTotalCredits = currentStats.totalCreditsEarned + creditsEarned;
      
      // Calculate streak
      const today = new Date();
      const lastQuizDate = currentStats.lastQuizDate ? new Date(currentStats.lastQuizDate) : null;
      const daysDiff = lastQuizDate ? Math.floor((today.getTime() - lastQuizDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      
      let newStreak = currentStats.currentStreak;
      if (daysDiff === 1) {
        newStreak += 1;
      } else if (daysDiff > 1) {
        newStreak = 1;
      }
      
      transaction.update(statsRef, {
        totalQuizzes: newTotalQuizzes,
        averageScore: Math.round(newAverageScore * 10) / 10,
        bestScore: newBestScore,
        totalCreditsEarned: newTotalCredits,
        currentStreak: newStreak,
        longestStreak: Math.max(currentStats.longestStreak, newStreak),
        lastQuizDate: today,
        updatedAt: today
      });
    } else {
      // Create new stats
      transaction.set(statsRef, {
        userId,
        skillId: quizId.split('_')[0], // Extract skillId from quizId
        totalQuizzes: 1,
        averageScore: score,
        bestScore: score,
        totalCreditsEarned: creditsEarned,
        currentStreak: 1,
        longestStreak: 1,
        lastQuizDate: new Date(),
        skillLevel: 'beginner',
        updatedAt: new Date()
      });
    }
  });
};

// Badge System
const checkAndAwardBadges = async (userId: string, quizId: string, score: number): Promise<void> => {
  const badgesToCheck: BadgeType[] = [];
  
  // Check for perfect score
  if (score === 100) {
    badgesToCheck.push('perfect_score');
  }
  
  // Check for first quiz
  const userStats = await getUserQuizStats(userId, quizId.split('_')[0]);
  if (userStats && userStats.totalQuizzes === 1) {
    badgesToCheck.push('first_quiz');
  }
  
  // Check for streaks
  if (userStats) {
    if (userStats.currentStreak >= 5) badgesToCheck.push('streak_5');
    if (userStats.currentStreak >= 10) badgesToCheck.push('streak_10');
    if (userStats.currentStreak >= 30) badgesToCheck.push('streak_30');
  }
  
  // Award badges
  for (const badgeType of badgesToCheck) {
    await awardBadge(userId, badgeType, quizId.split('_')[0]);
  }
};

export const awardBadge = async (userId: string, badgeType: BadgeType, skillId?: string): Promise<void> => {
  const badgeData = getBadgeData(badgeType);
  
  const badge: Omit<Badge, 'id'> = {
    userId,
    badgeType,
    badgeName: badgeData.name,
    description: badgeData.description,
    icon: badgeData.icon,
    earnedAt: new Date(),
    skillId
  };
  
  await addDoc(collection(db, 'badges'), badge);
};

const getBadgeData = (badgeType: BadgeType) => {
  const badgeMap = {
    'first_quiz': { name: 'First Quiz', description: 'Completed your first quiz!', icon: '🎯' },
    'perfect_score': { name: 'Perfect Score', description: 'Got 100% on a quiz!', icon: '🏆' },
    'streak_5': { name: '5-Day Streak', description: 'Quizzed for 5 days in a row!', icon: '🔥' },
    'streak_10': { name: '10-Day Streak', description: 'Quizzed for 10 days in a row!', icon: '⚡' },
    'streak_30': { name: '30-Day Streak', description: 'Quizzed for 30 days in a row!', icon: '💎' },
    'skill_master': { name: 'Skill Master', description: 'Mastered a skill!', icon: '👑' },
    'quiz_enthusiast': { name: 'Quiz Enthusiast', description: 'Completed 50 quizzes!', icon: '📚' },
    'speed_demon': { name: 'Speed Demon', description: 'Completed a quiz in record time!', icon: '⚡' },
    'accuracy_king': { name: 'Accuracy King', description: 'Maintained 90%+ accuracy!', icon: '🎯' },
    'dedicated_learner': { name: 'Dedicated Learner', description: 'Consistent learning for a month!', icon: '📖' }
  };
  
  return badgeMap[badgeType];
};

// Get user quiz statistics
export const getUserQuizStats = async (userId: string, skillId: string): Promise<UserQuizStats | null> => {
  const statsRef = doc(db, 'userQuizStats', `${userId}_${skillId}`);
  const statsDoc = await getDoc(statsRef);
  
  if (statsDoc.exists()) {
    return { id: statsDoc.id, ...statsDoc.data() } as UserQuizStats;
  }
  
  return null;
};

// Get user badges
export const getUserBadges = async (userId: string): Promise<Badge[]> => {
  const badgesRef = collection(db, 'badges');
  const q = query(badgesRef, where('userId', '==', userId), orderBy('earnedAt', 'desc'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Badge));
};

// Get leaderboard
export const getLeaderboard = async (limit: number = 10): Promise<LeaderboardEntry[]> => {
  // This would typically aggregate data from userQuizStats
  // For now, returning mock data
  return [
    {
      userId: 'user1',
      userName: 'Quiz Master',
      totalCredits: 150,
      totalQuizzes: 25,
      averageScore: 92,
      currentStreak: 7,
      rank: 1
    },
    {
      userId: 'user2',
      userName: 'Speed Learner',
      totalCredits: 120,
      totalQuizzes: 20,
      averageScore: 88,
      currentStreak: 5,
      rank: 2
    }
  ];
};

// Get skill insights
export const getSkillInsights = async (userId: string, skillId: string): Promise<SkillInsight | null> => {
  const userStats = await getUserQuizStats(userId, skillId);
  if (!userStats) return null;
  
  // Mock insights based on user performance
  return {
    skillId,
    skillName: 'JavaScript', // This would come from skill data
    strengths: ['Variables', 'Functions', 'Arrays'],
    weaknesses: ['Async Programming', 'Closures'],
    recommendedTopics: ['Promises', 'Async/Await', 'Event Loop'],
    progressTrend: userStats.averageScore > 80 ? 'improving' : 'stable',
    nextLevelTarget: userStats.averageScore + 10,
    studyRecommendations: [
      'Practice more async programming concepts',
      'Review closure fundamentals',
      'Try building small projects'
    ]
  };
};

// Get available quizzes for a skill
export const getAvailableQuizzes = async (skillId: string): Promise<Quiz[]> => {
  const quizzesRef = collection(db, 'quizzes');
  const q = query(quizzesRef, where('skillId', '==', skillId), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quiz));
};

// Get user's quiz attempts
export const getUserQuizAttempts = async (userId: string, limit: number = 10): Promise<QuizAttempt[]> => {
  const attemptsRef = collection(db, 'quizAttempts');
  const q = query(attemptsRef, where('userId', '==', userId), orderBy('completedAt', 'desc'), limit(limit));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuizAttempt));
};
