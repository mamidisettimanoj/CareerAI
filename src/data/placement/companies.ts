export interface CompanyRole {
  id: string;
  title: string;
  packageRange: { min: number; max: number };
  locations: string[];
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  website: string;
  description: string;
  roles: CompanyRole[];
}

export const COMPANIES: Company[] = [
  {
    id: 'tcs',
    name: 'Tata Consultancy Services',
    industry: 'IT Services',
    website: 'https://www.tcs.com',
    description: 'TCS is an IT services, consulting and business solutions organization.',
    roles: [
      { id: 'tcs-ninja', title: 'TCS Ninja (Systems Engineer)', packageRange: { min: 3.36, max: 3.36 }, locations: ['PAN India'] },
      { id: 'tcs-digital', title: 'TCS Digital (Systems Engineer - Specialist)', packageRange: { min: 7.0, max: 7.0 }, locations: ['PAN India'] },
      { id: 'tcs-prime', title: 'TCS Prime (Software Engineer)', packageRange: { min: 9.0, max: 9.0 }, locations: ['PAN India'] }
    ]
  },
  {
    id: 'infosys',
    name: 'Infosys',
    industry: 'IT Services',
    website: 'https://www.infosys.com',
    description: 'Infosys is a global leader in next-generation digital services and consulting.',
    roles: [
      { id: 'infy-se', title: 'Systems Engineer', packageRange: { min: 3.6, max: 3.6 }, locations: ['PAN India'] },
      { id: 'infy-sp', title: 'Specialist Programmer', packageRange: { min: 8.0, max: 8.0 }, locations: ['PAN India'] }
    ]
  },
  {
    id: 'amazon',
    name: 'Amazon',
    industry: 'Product / E-commerce',
    website: 'https://www.amazon.jobs',
    description: 'Amazon is a multinational technology company focusing on e-commerce, cloud computing, digital streaming, and AI.',
    roles: [
      { id: 'amazon-sde1', title: 'Software Development Engineer I (SDE-1)', packageRange: { min: 25.0, max: 45.0 }, locations: ['Bengaluru', 'Hyderabad', 'Delhi NCR'] }
    ]
  },
  {
    id: 'google',
    name: 'Google',
    industry: 'Product / Technology',
    website: 'https://careers.google.com',
    description: 'Google specializes in Internet-related services and products.',
    roles: [
      { id: 'google-swe', title: 'Software Engineer', packageRange: { min: 30.0, max: 60.0 }, locations: ['Bengaluru', 'Hyderabad', 'Pune'] }
    ]
  }
];
