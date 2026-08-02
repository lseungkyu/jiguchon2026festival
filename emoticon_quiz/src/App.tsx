import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Host from './pages/Host';
import Student from './pages/Student';
import Monitor from './pages/Monitor';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/host" element={<Host />} />
        <Route path="/student" element={<Student />} />
        <Route path="/monitor" element={<Monitor />} />
      </Routes>
    </Router>
  );
}

export default App;
