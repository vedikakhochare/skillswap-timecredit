import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db } from './firebase';
import { Skill } from './skillService';
import { getUserProfile } from './userService';

export interface SkillRecommendation {
  skill: Skill;
  score: number;
  reasons: string[];
  compatibility: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // in hours
  prerequisites: string[];
  relatedSkills: string[];
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  skills: SkillRecommendation[];
  totalDuration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  estimatedCompletion: number; // in days
  prerequisites: string[];
  outcomes: string[];
}

export interface SkillCompatibility {
  skill1: string;
  skill2: string;
  compatibility: number;
  reason: string;
  useCase: string;
}

export interface UserSkillProfile {
  userId: string;
  currentSkills: string[];
  learningGoals: string[];
  interests: string[];
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  availableTime: number; // hours per week
  preferredLearningStyle: 'visual' | 'hands-on' | 'theoretical' | 'collaborative';
  completedSessions: number;
  averageRating: number;
  lastActive: Date;
}

// Skill categories and their relationships
const SKILL_CATEGORIES = {
  'Programming': {
    skills: ['JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'Java', 'C++', 'Go', 'Rust'],
    related: ['Web Development', 'Data Science', 'Mobile Development', 'DevOps'],
    difficulty: 'intermediate'
  },
  'Design': {
    skills: ['UI/UX Design', 'Graphic Design', 'Figma', 'Adobe Creative Suite', 'Sketch', 'Photoshop'],
    related: ['Web Development', 'Marketing', 'Photography', 'Video Editing'],
    difficulty: 'beginner'
  },
  'Data Science': {
    skills: ['Python', 'R', 'Machine Learning', 'Statistics', 'SQL', 'Pandas', 'NumPy', 'TensorFlow'],
    related: ['Programming', 'Business Analysis', 'Research', 'AI/ML'],
    difficulty: 'advanced'
  },
  'Languages': {
    skills: ['Spanish', 'French', 'German', 'Mandarin', 'Japanese', 'Portuguese', 'Italian'],
    related: ['Communication', 'Travel', 'Business', 'Culture'],
    difficulty: 'beginner'
  },
  'Business': {
    skills: ['Project Management', 'Marketing', 'Sales', 'Finance', 'Leadership', 'Strategy'],
    related: ['Communication', 'Management', 'Entrepreneurship', 'Analytics'],
    difficulty: 'intermediate'
  },
  'Creative': {
    skills: ['Photography', 'Video Editing', 'Music Production', 'Writing', 'Drawing', 'Cooking'],
    related: ['Design', 'Marketing', 'Entertainment', 'Lifestyle'],
    difficulty: 'beginner'
  }
};

// Skill compatibility matrix
const SKILL_COMPATIBILITY: SkillCompatibility[] = [
  {
    skill1: 'JavaScript',
    skill2: 'React',
    compatibility: 0.95,
    reason: 'React is built on JavaScript',
    useCase: 'Web Development'
  },
  {
    skill1: 'Python',
    skill2: 'Data Science',
    compatibility: 0.9,
    reason: 'Python is the primary language for data science',
    useCase: 'Data Analysis'
  },
  {
    skill1: 'UI/UX Design',
    skill2: 'Figma',
    compatibility: 0.9,
    reason: 'Figma is the industry standard for UI/UX design',
    useCase: 'Design Work'
  },
  {
    skill1: 'Marketing',
    skill2: 'Graphic Design',
    compatibility: 0.8,
    reason: 'Visual content is essential for marketing',
    useCase: 'Campaign Creation'
  },
  {
    skill1: 'Project Management',
    skill2: 'Leadership',
    compatibility: 0.85,
    reason: 'Leadership skills enhance project management effectiveness',
    useCase: 'Team Management'
  }
];

// Generate user skill profile from user data
export const generateUserSkillProfile = async (userId: string): Promise<UserSkillProfile> => {
  try {
    const userProfile = await getUserProfile(userId);
    
    // Get user's skills from their created skills
    const skillsQuery = query(
      collection(db, 'skills'),
      where('providerId', '==', userId)
    );
    const skillsSnapshot = await getDocs(skillsQuery);
    const userSkills = skillsSnapshot.docs.map(doc => doc.data().title);

    // Get user's booking history to determine experience
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('requesterId', '==', userId)
    );
    const bookingsSnapshot = await getDocs(bookingsQuery);
    const completedSessions = bookingsSnapshot.docs.filter(doc => 
      doc.data().status === 'completed'
    ).length;

    // Determine experience level based on completed sessions
    let experienceLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
    if (completedSessions > 20) experienceLevel = 'advanced';
    else if (completedSessions > 5) experienceLevel = 'intermediate';

    // Extract interests from skill categories
    const interests = userSkills.map(skill => {
      for (const [category, data] of Object.entries(SKILL_CATEGORIES)) {
        if (data.skills.some(s => s.toLowerCase().includes(skill.toLowerCase()))) {
          return category;
        }
      }
      return 'General';
    });

    return {
      userId,
      currentSkills: userSkills,
      learningGoals: [], // Will be populated by user input
      interests: [...new Set(interests)],
      experienceLevel,
      availableTime: 5, // Default, will be updated by user
      preferredLearningStyle: 'hands-on', // Default
      completedSessions,
      averageRating: 0, // Will be calculated from reviews
      lastActive: new Date()
    };
  } catch (error) {
    console.error('Error generating user skill profile:', error);
    return {
      userId,
      currentSkills: [],
      learningGoals: [],
      interests: [],
      experienceLevel: 'beginner',
      availableTime: 5,
      preferredLearningStyle: 'hands-on',
      completedSessions: 0,
      averageRating: 0,
      lastActive: new Date()
    };
  }
};

// Get skill recommendations based on user profile
export const getSkillRecommendations = async (
  userId: string, 
  limitCount: number = 10
): Promise<SkillRecommendation[]> => {
  try {
    const userProfile = await generateUserSkillProfile(userId);
    const allSkills = await getAllSkills();
    
    const recommendations: SkillRecommendation[] = [];

    for (const skill of allSkills) {
      // Skip skills the user already has
      if (userProfile.currentSkills.some(userSkill => 
        userSkill.toLowerCase().includes(skill.title.toLowerCase())
      )) {
        continue;
      }

      const score = calculateSkillScore(skill, userProfile);
      const compatibility = calculateSkillCompatibility(skill, userProfile);
      const difficulty = determineSkillDifficulty(skill, userProfile);
      const reasons = generateRecommendationReasons(skill, userProfile);
      const prerequisites = findPrerequisites(skill, userProfile);
      const relatedSkills = findRelatedSkills(skill, userProfile);
      const estimatedTime = estimateLearningTime(skill, userProfile);

      if (score > 0.3) { // Only recommend skills with decent compatibility
        recommendations.push({
          skill,
          score,
          reasons,
          compatibility,
          difficulty,
          estimatedTime,
          prerequisites,
          relatedSkills
        });
      }
    }

    // Sort by score and return top recommendations
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limitCount);

  } catch (error) {
    console.error('Error getting skill recommendations:', error);
    return [];
  }
};

// Calculate skill compatibility score
const calculateSkillScore = (skill: Skill, userProfile: UserSkillProfile): number => {
  let score = 0;

  // Interest matching (40% weight)
  const categoryMatch = findSkillCategory(skill.title);
  if (categoryMatch && userProfile.interests.includes(categoryMatch)) {
    score += 0.4;
  }

  // Experience level matching (30% weight)
  const skillDifficulty = determineSkillDifficulty(skill, userProfile);
  if (skillDifficulty === userProfile.experienceLevel) {
    score += 0.3;
  } else if (
    (userProfile.experienceLevel === 'beginner' && skillDifficulty === 'intermediate') ||
    (userProfile.experienceLevel === 'intermediate' && skillDifficulty === 'advanced')
  ) {
    score += 0.2; // Partial match for next level
  }

  // Skill compatibility (20% weight)
  const compatibility = calculateSkillCompatibility(skill, userProfile);
  score += compatibility * 0.2;

  // Popularity and demand (10% weight)
  const popularityScore = Math.min(skill.totalSessions || 0, 100) / 100;
  score += popularityScore * 0.1;

  return Math.min(score, 1);
};

// Calculate compatibility with existing skills
const calculateSkillCompatibility = (skill: Skill, userProfile: UserSkillProfile): number => {
  let maxCompatibility = 0;

  for (const userSkill of userProfile.currentSkills) {
    const compatibility = SKILL_COMPATIBILITY.find(comp => 
      (comp.skill1.toLowerCase() === skill.title.toLowerCase() && 
       comp.skill2.toLowerCase() === userSkill.toLowerCase()) ||
      (comp.skill2.toLowerCase() === skill.title.toLowerCase() && 
       comp.skill1.toLowerCase() === userSkill.toLowerCase())
    );

    if (compatibility) {
      maxCompatibility = Math.max(maxCompatibility, compatibility.compatibility);
    }
  }

  return maxCompatibility;
};

// Determine skill difficulty based on various factors
const determineSkillDifficulty = (skill: Skill, userProfile: UserSkillProfile): 'beginner' | 'intermediate' | 'advanced' => {
  const category = findSkillCategory(skill.title);
  if (category && SKILL_CATEGORIES[category as keyof typeof SKILL_CATEGORIES]) {
    return SKILL_CATEGORIES[category as keyof typeof SKILL_CATEGORIES].difficulty as 'beginner' | 'intermediate' | 'advanced';
  }

  // Fallback based on skill characteristics
  if (skill.creditsPerHour > 5) return 'advanced';
  if (skill.creditsPerHour > 2) return 'intermediate';
  return 'beginner';
};

// Generate reasons for recommendation
const generateRecommendationReasons = (skill: Skill, userProfile: UserSkillProfile): string[] => {
  const reasons: string[] = [];
  const category = findSkillCategory(skill.title);

  if (category && userProfile.interests.includes(category)) {
    reasons.push(`Matches your interest in ${category}`);
  }

  const compatibility = calculateSkillCompatibility(skill, userProfile);
  if (compatibility > 0.7) {
    reasons.push('Complements your existing skills');
  }

  if (skill.rating && skill.rating > 4.5) {
    reasons.push('Highly rated by the community');
  }

  if (skill.totalSessions && skill.totalSessions > 20) {
    reasons.push('Popular choice among learners');
  }

  return reasons;
};

// Find prerequisites for a skill
const findPrerequisites = (skill: Skill, userProfile: UserSkillProfile): string[] => {
  const prerequisites: string[] = [];
  const category = findSkillCategory(skill.title);

  if (category === 'Programming' && skill.title.includes('React')) {
    prerequisites.push('JavaScript', 'HTML', 'CSS');
  } else if (category === 'Data Science') {
    prerequisites.push('Python', 'Statistics');
  } else if (category === 'Design' && skill.title.includes('UI/UX')) {
    prerequisites.push('Graphic Design', 'User Research');
  }

  return prerequisites.filter(prereq => 
    !userProfile.currentSkills.some(skill => 
      skill.toLowerCase().includes(prereq.toLowerCase())
    )
  );
};

// Find related skills
const findRelatedSkills = (skill: Skill, userProfile: UserSkillProfile): string[] => {
  const category = findSkillCategory(skill.title);
  if (category && SKILL_CATEGORIES[category as keyof typeof SKILL_CATEGORIES]) {
    return SKILL_CATEGORIES[category as keyof typeof SKILL_CATEGORIES].skills
      .filter(s => s !== skill.title)
      .slice(0, 3);
  }
  return [];
};

// Estimate learning time
const estimateLearningTime = (skill: Skill, userProfile: UserSkillProfile): number => {
  const difficulty = determineSkillDifficulty(skill, userProfile);
  const baseTime = skill.creditsPerHour || 1;

  switch (difficulty) {
    case 'beginner': return Math.max(2, baseTime * 0.5);
    case 'intermediate': return Math.max(5, baseTime * 1);
    case 'advanced': return Math.max(10, baseTime * 2);
    default: return baseTime;
  }
};

// Find skill category
const findSkillCategory = (skillTitle: string): string | null => {
  for (const [category, data] of Object.entries(SKILL_CATEGORIES)) {
    if (data.skills.some(skill => 
      skill.toLowerCase().includes(skillTitle.toLowerCase()) ||
      skillTitle.toLowerCase().includes(skill.toLowerCase())
    )) {
      return category;
    }
  }
  return null;
};

// Get all skills from database
const getAllSkills = async (): Promise<Skill[]> => {
  try {
    const skillsSnapshot = await getDocs(collection(db, 'skills'));
    return skillsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    } as Skill));
  } catch (error) {
    console.error('Error getting all skills:', error);
    return [];
  }
};

// Generate learning paths
export const generateLearningPaths = async (userId: string): Promise<LearningPath[]> => {
  try {
    const userProfile = await generateUserSkillProfile(userId);
    const recommendations = await getSkillRecommendations(userId, 20);
    
    const learningPaths: LearningPath[] = [];

    // Group recommendations by category
    const categoryGroups = recommendations.reduce((groups, rec) => {
      const category = findSkillCategory(rec.skill.title) || 'General';
      if (!groups[category]) groups[category] = [];
      groups[category].push(rec);
      return groups;
    }, {} as Record<string, SkillRecommendation[]>);

    // Create learning paths for each category
    for (const [category, skills] of Object.entries(categoryGroups)) {
      if (skills.length >= 3) {
        const sortedSkills = skills.sort((a, b) => {
          // Sort by difficulty first, then by score
          const difficultyOrder = { 'beginner': 0, 'intermediate': 1, 'advanced': 2 };
          const aDiff = difficultyOrder[a.difficulty];
          const bDiff = difficultyOrder[b.difficulty];
          
          if (aDiff !== bDiff) return aDiff - bDiff;
          return b.score - a.score;
        });

        const totalDuration = sortedSkills.reduce((sum, skill) => sum + skill.estimatedTime, 0);
        const difficulty = sortedSkills[0].difficulty; // Use first skill's difficulty
        const estimatedCompletion = Math.ceil(totalDuration / userProfile.availableTime);

        learningPaths.push({
          id: `path-${category.toLowerCase().replace(/\s+/g, '-')}`,
          title: `${category} Mastery Path`,
          description: `A comprehensive learning path to master ${category} skills`,
          skills: sortedSkills.slice(0, 5), // Limit to 5 skills per path
          totalDuration,
          difficulty,
          category,
          estimatedCompletion,
          prerequisites: [],
          outcomes: [
            `Master ${category} fundamentals`,
            `Build practical ${category} projects`,
            `Gain industry-relevant ${category} skills`
          ]
        });
      }
    }

    return learningPaths.slice(0, 5); // Return top 5 learning paths

  } catch (error) {
    console.error('Error generating learning paths:', error);
    return [];
  }
};

// Get skill compatibility matrix
export const getSkillCompatibility = (): SkillCompatibility[] => {
  return SKILL_COMPATIBILITY;
};

// Get skill categories
export const getSkillCategories = () => {
  return SKILL_CATEGORIES;
};
