import React, { useState, useEffect } from 'react';
import { Select, Form } from 'antd';
import { State, City } from 'country-state-city';

const { Option } = Select;

interface LocationSelectorProps {
  onLocationChange?: (location: { state: string; district: string; }) => void;
  initialValues?: {
    state?: string;
    district?: string;
  };
}

const LocationSelector: React.FC<LocationSelectorProps> = ({ onLocationChange, initialValues }) => {
  const [states] = useState(State.getStatesOfCountry('IN'));
  const [cities, setCities] = useState<any[]>([]);
  const [selectedState, setSelectedState] = useState<string | undefined>(initialValues?.state);

  useEffect(() => {
    if (selectedState) {
      const stateCities = City.getCitiesOfState('IN', selectedState);
      setCities(stateCities);
    } else {
      setCities([]);
    }
  }, [selectedState]);

  const handleStateChange = (stateCode: string) => {
    setSelectedState(stateCode);
    const stateName = states.find(s => s.isoCode === stateCode)?.name || '';
    onLocationChange?.({ state: stateName, district: '' });
  };

  const handleCityChange = (cityName: string) => {
    const stateName = states.find(s => s.isoCode === selectedState)?.name || '';
    onLocationChange?.({ state: stateName, district: cityName });
  };

  return (
    <>
      <Form.Item name="state" label="State" rules={[{ required: true, message: 'Please select state' }]}>
        <Select
          placeholder="Select State"
          onChange={handleStateChange}
          showSearch
          filterOption={(input, option) =>
            (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
          }
        >
          {states.map(state => (
            <Option key={state.isoCode} value={state.isoCode}>
              {state.name}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item name="district" label="District" rules={[{ required: true, message: 'Please select district' }]}>
        <Select
          placeholder="Select District"
          onChange={handleCityChange}
          disabled={!selectedState}
          showSearch
          filterOption={(input, option) =>
            (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
          }
        >
          {cities.map(city => (
            <Option key={city.name} value={city.name}>
              {city.name}
            </Option>
          ))}
        </Select>
      </Form.Item>
    </>
  );
};

export default LocationSelector;