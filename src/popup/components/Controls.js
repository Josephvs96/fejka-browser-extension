import React, { useState } from 'react';

const Controls = ({ onGenerate, onPopulateForm, onClearData }) => {
  const [ageMin, setAgeMin] = useState('');
  const [ageMax, setAgeMax] = useState('');
  const [gender, setGender] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = () => {
    setIsLoading(true);
    const params = {};
    if (ageMin) params.age_min = ageMin;
    if (ageMax) params.age_max = ageMax;
    if (gender) params.gender = gender;
    
    onGenerate(params);
    setIsLoading(false);
  };

  return (
    <div className="column is-5">
      <div className="control-section">
        <div className="field mb-4">
          <div className="columns is-mobile mb-3">
            <div className="column pl-0 pr-1">
              <div className="field">
                <label className="label is-small" htmlFor="min-age">Min Age</label>
                <div className="control">
                  <input 
                    id="min-age"
                    className="input is-small" 
                    type="number" 
                    min="0" 
                    max="120"
                    value={ageMin}
                    onChange={(e) => setAgeMin(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="column pr-0 pl-1">
              <div className="field">
                <label className="label is-small" htmlFor="max-age">Max Age</label>
                <div className="control">
                  <input 
                    id="max-age"
                    className="input is-small" 
                    type="number" 
                    min="0" 
                    max="120"
                    value={ageMax}
                    onChange={(e) => setAgeMax(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        
          <div className="field">
            <label className="label is-small" htmlFor="gender">Gender</label>
            <div className="control">
              <div className="select is-small is-fullwidth">
                <select 
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="">Any</option>
                  <option value="man">Man</option>
                  <option value="woman">Woman</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="buttons">
          <button 
            className={`button is-fullwidth is-primary mb-2 ${isLoading ? 'is-loading' : ''}`}
            onClick={handleGenerate}
            disabled={isLoading}
          >
            <span className="icon is-small">
              <i className="fas fa-user-plus"></i>
            </span>
            <span>Generate New Person</span>
          </button>
          
          <button 
            className="button is-fullwidth is-info mb-2"
            onClick={onPopulateForm}
            disabled={isLoading}
          >
            <span className="icon is-small">
              <i className="fas fa-file-import"></i>
            </span>
            <span>Populate Form on Page</span>
          </button>

          <button 
            className="button is-fullwidth is-danger"
            onClick={onClearData}
            disabled={isLoading}
          >
            <span className="icon is-small">
              <i className="fas fa-trash"></i>
            </span>
            <span>Clear Cached Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Controls;