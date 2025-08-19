import React from 'react';

const PersonData = ({ data }) => {
  if (!data) {
    return (
      <div className="column is-7 is-flex is-justify-content-center is-align-items-center">
        <div className="has-text-centered">
          <span className="icon is-large">
            <i className="fas fa-user-circle fa-3x"></i>
          </span>
          <p className="mt-3 has-text-grey">
            No person data generated yet.<br/>
            Click "Generate New Person" to get started.
          </p>
        </div>
      </div>
    );
  }

  const sections = [
    {
      title: 'Personal Information',
      icon: 'fas fa-user',
      data: {
        name: data.name || `${data.fname || ''} ${data.lname || ''}`.trim(),
        gender: data.gender,
        age: data.age,
        pnr: data.pnr,
        pnr_short: data.pnr_short
      }
    },
    {
      title: 'Contact Information',
      icon: 'fas fa-address-book',
      data: {
        email: data.email,
        phone: data.phone,
        ip: data.ip
      }
    },
    {
      title: 'Address',
      icon: 'fas fa-home',
      data: {
        street: data.street,
        city: data.city,
        zip: data.zip,
        address: data.address
      }
    }
  ];

  const formatLabel = (label) => {
    return label
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div className="column is-7">
      {sections.map((section, sectionIndex) => {
        const hasData = Object.values(section.data).some(val => val);
        if (!hasData) return null;

        return (
          <div key={section.title}>
            <div className="card-header is-flex is-align-items-center mb-2 py-1">
              <span className="icon has-text-dark mr-2">
                <i className={section.icon}></i>
              </span>
              <span className="card-header-title has-text-weight-semibold">
                {section.title}
              </span>
            </div>

            {Object.entries(section.data).map(([key, value]) => {
              if (!value) return null;
              return (
                <div key={key} className="data-item columns is-mobile mb-0 py-1">
                  <div className="data-label column is-two-fifths has-text-weight-medium">
                    {formatLabel(key)}:
                  </div>
                  <div className="data-value column">
                    {value}
                  </div>
                </div>
              );
            })}

            {sectionIndex < sections.length - 1 && (
              <div className="my-3" />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PersonData;
