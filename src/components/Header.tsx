import React from 'react';

const Header: React.FC = () => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  // getDay(): 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  // Map to days array index: Mon=0 … Fri=4; weekend = -1 (no highlight)
  const dayOfWeek = new Date().getDay();
  const todayIndex = (dayOfWeek >= 1 && dayOfWeek <= 5) ? dayOfWeek - 1 : -1;

  return (
    <header className="header">
      <div className="header-brand">
        <div className="logo">
          <img src="gmulogo.png" alt="GMU Logo" className="logo-image" />
          <h1 className="logo-title">Planner</h1>
        </div>
      </div>
      <nav className="header-nav" id="headerNav">
        {days.map((day, idx) => (
          <div key={day} className={`nav-day${idx === todayIndex ? ' today' : ''}`}>
            {day}
          </div>
        ))}
      </nav>
    </header>
  );
};

export default Header;