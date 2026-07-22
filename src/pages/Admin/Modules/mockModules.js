/**
 * mockModules.js
 * SENTRI's curriculum is fixed: exactly six cybersecurity training
 * modules, always present. There is no create/delete/duplicate — admins
 * manage each predefined module's content and settings (via the future
 * Module Configuration page), not the roster of modules itself.
 */

export const MODULES = [
  {
    id: 'password-security',
    name: 'Password Security',
    shortDescription:
      'Learn to create strong passwords and manage credentials safely using password managers and multi-factor authentication.',
    difficulty: 'Beginner',
    estimatedTime: '15 min',
    status: 'Enabled',
    assignedGroups: ['BSIT 1-A', 'BSIT 1-B', 'BSCS 1-A'],
    enrolledStudents: 142,
    prerequisiteId: null,
    icon: '🔑',
    color: '#B8860B',
  },
  {
    id: 'phishing-awareness',
    name: 'Phishing Awareness',
    shortDescription:
      'Recognize deceptive emails, messages, and websites designed to steal credentials or personal information.',
    difficulty: 'Beginner',
    estimatedTime: '18 min',
    status: 'Enabled',
    assignedGroups: ['BSIT 1-A', 'BSIT 1-B'],
    enrolledStudents: 128,
    prerequisiteId: 'password-security',
    icon: '🎣',
    color: '#C0392B',
  },
  {
    id: 'malware-awareness',
    name: 'Malware Awareness',
    shortDescription:
      'Understand how ransomware, trojans, and spyware spread, and how to recognize an infected device early.',
    difficulty: 'Intermediate',
    estimatedTime: '22 min',
    status: 'Disabled',
    assignedGroups: [],
    enrolledStudents: 0,
    prerequisiteId: 'safe-browsing',
    icon: '🦠',
    color: '#16697A',
  },
  {
    id: 'safe-browsing',
    name: 'Safe Browsing',
    shortDescription:
      'Identify malicious websites, verify secure connections, and avoid drive-by downloads while browsing.',
    difficulty: 'Intermediate',
    estimatedTime: '20 min',
    status: 'Enabled',
    assignedGroups: ['BSIT 1-A', 'BSCS 1-A'],
    enrolledStudents: 96,
    prerequisiteId: 'online-safety',
    icon: '🌐',
    color: '#2E86AB',
  },
  {
    id: 'data-privacy',
    name: 'Data Privacy',
    shortDescription:
      'Understand what personal data is collected online and how to limit exposure across apps and services.',
    difficulty: 'Advanced',
    estimatedTime: '25 min',
    status: 'Disabled',
    assignedGroups: [],
    enrolledStudents: 0,
    prerequisiteId: 'phishing-awareness',
    icon: '🔐',
    color: '#34495E',
  },
  {
    id: 'online-safety',
    name: 'Online Safety',
    shortDescription:
      'Build safe habits for everyday internet use, from social media to public Wi-Fi and personal device security.',
    difficulty: 'Beginner',
    estimatedTime: '16 min',
    status: 'Enabled',
    assignedGroups: ['BSIT 1-A', 'BSIT 1-B', 'BSCS 1-A', 'BSCS 1-B'],
    enrolledStudents: 187,
    prerequisiteId: null,
    icon: '🧭',
    color: '#1E7E34',
  },
]

export function getModuleName(id) {
  return MODULES.find((m) => m.id === id)?.name || null
}

/**
 * CATEGORY_META
 * Legacy export kept for backward compatibility — ModulePreview's mock
 * data (src/pages/Admin/ModulePreview/mockPreviewModule.js) still reads
 * this by category name. The curriculum itself has no category concept
 * anymore (each of the six modules is its own fixed entry above).
 */
export const CATEGORY_META = {
  'Password Security':  { icon: '🔑', color: '#B8860B' },
  'Phishing':            { icon: '🎣', color: '#C0392B' },
  'Social Engineering':  { icon: '🎭', color: '#7B2D8B' },
  'Network Security':    { icon: '🌐', color: '#2E86AB' },
  'Safe Browsing':       { icon: '🧭', color: '#1E7E34' },
  'Malware':             { icon: '🦠', color: '#16697A' },
  'Data Privacy':        { icon: '🔐', color: '#34495E' },
  'Email Security':      { icon: '📧', color: '#CA6F1E' },
}
