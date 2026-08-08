import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { FullLayout } from './components/layout/FullLayout';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { Predict } from './pages/Predict';
import { Result } from './pages/Result';
import { Calculators } from './pages/Calculators';
import { Academic } from './pages/Academic';
import { Eligibility } from './pages/Eligibility';
import { Skills } from './pages/Skills';
import { Resume } from './pages/Resume';
import { Preparation } from './pages/Preparation';
import { About } from './pages/About';
import { Settings } from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<FullLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/predict" element={<Predict />} />
          <Route path="/result" element={<Result />} />
        </Route>
        
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/calculators" element={<Calculators />} />
          <Route path="/academic" element={<Academic />} />
          <Route path="/eligibility" element={<Eligibility />} />
          <Route path="/skills" element={<Skills />} />
          <Route path="/resume" element={<Resume />} />
          <Route path="/preparation" element={<Preparation />} />
          <Route path="/about" element={<About />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
