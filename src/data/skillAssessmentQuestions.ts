export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface AssessmentCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  questions: Question[];
}

export const skillAssessments: AssessmentCategory[] = [
  {
    id: "technical",
    name: "Technical Skills",
    description: "Test your programming, data analysis, and technical problem-solving abilities.",
    icon: "Code",
    questions: [
      {
        id: "t1",
        question: "What is the time complexity of binary search?",
        options: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
        correctAnswer: 1,
      },
      {
        id: "t2",
        question: "Which data structure uses LIFO (Last In First Out)?",
        options: ["Queue", "Array", "Stack", "Linked List"],
        correctAnswer: 2,
      },
      {
        id: "t3",
        question: "What does SQL stand for?",
        options: [
          "Structured Query Language",
          "Simple Query Language",
          "Standard Query Logic",
          "System Query Language",
        ],
        correctAnswer: 0,
      },
      {
        id: "t4",
        question: "Which of the following is NOT a programming paradigm?",
        options: ["Object-Oriented", "Functional", "Procedural", "Alphabetical"],
        correctAnswer: 3,
      },
      {
        id: "t5",
        question: "What is the purpose of version control systems like Git?",
        options: [
          "To compile code faster",
          "To track changes and collaborate on code",
          "To run automated tests",
          "To deploy applications",
        ],
        correctAnswer: 1,
      },
      {
        id: "t6",
        question: "Which protocol is used for secure web communication?",
        options: ["HTTP", "FTP", "HTTPS", "SMTP"],
        correctAnswer: 2,
      },
      {
        id: "t7",
        question: "What is an API?",
        options: [
          "A programming language",
          "A type of database",
          "An interface for software interaction",
          "A web browser",
        ],
        correctAnswer: 2,
      },
      {
        id: "t8",
        question: "Which of these is a NoSQL database?",
        options: ["MySQL", "PostgreSQL", "MongoDB", "Oracle"],
        correctAnswer: 2,
      },
      {
        id: "t9",
        question: "What does CSS stand for?",
        options: [
          "Computer Style Sheets",
          "Cascading Style Sheets",
          "Creative Style System",
          "Coded Style Syntax",
        ],
        correctAnswer: 1,
      },
      {
        id: "t10",
        question: "What is the main purpose of cloud computing?",
        options: [
          "To predict weather",
          "To provide on-demand computing resources over the internet",
          "To store files locally",
          "To speed up internet connection",
        ],
        correctAnswer: 1,
      },
    ],
  },
  {
    id: "soft-skills",
    name: "Soft Skills",
    description: "Evaluate your communication, leadership, and interpersonal abilities.",
    icon: "Users",
    questions: [
      {
        id: "s1",
        question: "When receiving constructive criticism, the best approach is to:",
        options: [
          "Immediately defend your actions",
          "Listen actively and ask clarifying questions",
          "Ignore the feedback",
          "Respond with criticism of your own",
        ],
        correctAnswer: 1,
      },
      {
        id: "s2",
        question: "What is active listening?",
        options: [
          "Listening while doing other tasks",
          "Fully concentrating and responding to what is being said",
          "Only hearing the words spoken",
          "Waiting for your turn to speak",
        ],
        correctAnswer: 1,
      },
      {
        id: "s3",
        question: "In a team conflict, the best first step is usually to:",
        options: [
          "Take sides with one party",
          "Ignore the conflict",
          "Understand all perspectives before acting",
          "Escalate to management immediately",
        ],
        correctAnswer: 2,
      },
      {
        id: "s4",
        question: "Effective time management involves:",
        options: [
          "Working longer hours",
          "Prioritizing tasks and setting realistic deadlines",
          "Doing everything at once",
          "Avoiding difficult tasks",
        ],
        correctAnswer: 1,
      },
      {
        id: "s5",
        question: "Emotional intelligence primarily involves:",
        options: [
          "Having a high IQ",
          "Suppressing emotions",
          "Understanding and managing emotions effectively",
          "Being highly logical",
        ],
        correctAnswer: 2,
      },
      {
        id: "s6",
        question: "When delegating tasks, it's important to:",
        options: [
          "Give minimal instructions",
          "Do all the important work yourself",
          "Clearly communicate expectations and provide support",
          "Assign tasks randomly",
        ],
        correctAnswer: 2,
      },
      {
        id: "s7",
        question: "Networking effectively means:",
        options: [
          "Collecting as many business cards as possible",
          "Building genuine, mutually beneficial relationships",
          "Only talking to senior people",
          "Avoiding professional events",
        ],
        correctAnswer: 1,
      },
      {
        id: "s8",
        question: "When facing a tight deadline, you should:",
        options: [
          "Panic and work frantically",
          "Communicate proactively and prioritize tasks",
          "Work in isolation",
          "Blame others for the time pressure",
        ],
        correctAnswer: 1,
      },
      {
        id: "s9",
        question: "A growth mindset involves believing that:",
        options: [
          "Abilities are fixed and cannot change",
          "Success is based purely on talent",
          "Abilities can be developed through effort and learning",
          "Failure should be avoided at all costs",
        ],
        correctAnswer: 2,
      },
      {
        id: "s10",
        question: "Effective feedback should be:",
        options: [
          "Vague and general",
          "Specific, timely, and actionable",
          "Given only when negative",
          "Delivered publicly to maximize impact",
        ],
        correctAnswer: 1,
      },
    ],
  },
  {
    id: "industry",
    name: "Industry Knowledge",
    description: "Assess your understanding of business trends and professional best practices.",
    icon: "TrendingUp",
    questions: [
      {
        id: "i1",
        question: "What does 'digital transformation' primarily refer to?",
        options: [
          "Converting physical documents to digital",
          "Integrating digital technology into all business areas",
          "Using social media",
          "Buying new computers",
        ],
        correctAnswer: 1,
      },
      {
        id: "i2",
        question: "What is 'agile methodology' in project management?",
        options: [
          "Working faster",
          "A flexible, iterative approach to development",
          "Avoiding planning",
          "Working independently",
        ],
        correctAnswer: 1,
      },
      {
        id: "i3",
        question: "What does ROI stand for?",
        options: [
          "Rate of Interest",
          "Return on Investment",
          "Risk of Implementation",
          "Range of Influence",
        ],
        correctAnswer: 1,
      },
      {
        id: "i4",
        question: "What is 'remote work' or 'hybrid work'?",
        options: [
          "Working only in an office",
          "Working from locations outside the traditional office",
          "Working overtime",
          "Working for multiple companies",
        ],
        correctAnswer: 1,
      },
      {
        id: "i5",
        question: "What is the purpose of a 'SWOT analysis'?",
        options: [
          "To analyze financial statements",
          "To evaluate Strengths, Weaknesses, Opportunities, and Threats",
          "To measure employee performance",
          "To track inventory",
        ],
        correctAnswer: 1,
      },
      {
        id: "i6",
        question: "What does 'sustainability' mean in a business context?",
        options: [
          "Maintaining current profits",
          "Meeting present needs without compromising future generations",
          "Reducing staff",
          "Increasing production speed",
        ],
        correctAnswer: 1,
      },
      {
        id: "i7",
        question: "What is 'artificial intelligence (AI)' primarily used for in business?",
        options: [
          "Replacing all human workers",
          "Automating tasks and deriving insights from data",
          "Creating art only",
          "Entertainment purposes only",
        ],
        correctAnswer: 1,
      },
      {
        id: "i8",
        question: "What is 'customer experience (CX)'?",
        options: [
          "The price customers pay",
          "The overall perception customers have of a company",
          "Customer service hours",
          "The number of products sold",
        ],
        correctAnswer: 1,
      },
      {
        id: "i9",
        question: "What does 'B2B' stand for?",
        options: [
          "Back to Basics",
          "Business to Business",
          "Buyer to Buyer",
          "Brand to Brand",
        ],
        correctAnswer: 1,
      },
      {
        id: "i10",
        question: "What is 'upskilling'?",
        options: [
          "Getting promoted",
          "Learning new skills to enhance current capabilities",
          "Working more hours",
          "Changing careers completely",
        ],
        correctAnswer: 1,
      },
    ],
  },
];
