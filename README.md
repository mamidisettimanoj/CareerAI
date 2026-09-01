# Student Career & Placement Analyzer (CareerAI)

CareerAI is an intelligent, client-side React application designed to help Indian college students prepare for campus placements. It provides a suite of analytics tools, academic calculators, skill gap analysis, and placement readiness estimations.

## Features

- **Placement Readiness Estimate**: Client-side prediction of placement probability based on academic and skill factors.
- **Academic Analytics**: SGPA and CGPA calculators, percentage converters, and semester trend visualizations.
- **Skill Gap Analyzer**: Compare your current skills against industry requirements for specific roles.
- **Resume Readiness**: Client-side parsing and evaluation of resume completeness.
- **Career Preparation Tracker**: Track tasks, mock interviews, and technical skills.
- **Local Storage**: All data is securely stored in your browser's LocalStorage.
- **Report Generation**: Export your career profile as a professional PDF.
- **Import/Export**: Easily backup and restore your profile data.

## Technology Stack

- **Framework**: React + Vite + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Icons**: Lucide React
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod
- **PDF Generation**: jsPDF + html2canvas

## Installation & Local Development

1. **Clone the repository** (if applicable)
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Run the development server**:
   ```bash
   npm run dev
   ```
4. **Build for production**:
   ```bash
   npm run build
   ```

## Vercel Deployment

This application is fully client-side and optimized for Vercel deployment without a backend.
1. Connect the repository to Vercel.
2. The build command is `npm run build` and output directory is `dist`.
3. Vercel's default React configuration works perfectly as there are no backend APIs required.

## Privacy Notice

All data is processed and stored locally in the browser. No personal student data is transmitted to an external server. The "Placement Probability Estimate" is an educational simulation based on common industry factors and is not a scientifically validated machine learning model.
