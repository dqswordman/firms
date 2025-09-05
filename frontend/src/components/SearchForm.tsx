import React, { useState } from 'react';
import { SearchParams } from '../types';
import {
  Paper,
  Box,
  Typography,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  TextField,
  Select,
  MenuItem,
  Button,
  Divider
} from '@mui/material';

interface SearchFormProps {
  onSearch: (params: SearchParams) => void;
}

const SearchForm: React.FC<SearchFormProps> = ({ onSearch }) => {
  const [mode, setMode] = useState<'country' | 'bbox'>('country');
  const [country, setCountry] = useState('');
  const [west, setWest] = useState('');
  const [south, setSouth] = useState('');
  const [east, setEast] = useState('');
  const [north, setNorth] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [format, setFormat] = useState<'geojson' | 'json'>('geojson');
  const [dataset, setDataset] = useState<string>('auto');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return alert('Please select a valid date range');
    const sd = new Date(startDate);
    const ed = new Date(endDate);
    if (isNaN(sd.getTime()) || isNaN(ed.getTime())) return alert('Invalid date format');
    if (sd > ed) return alert('Start date must not be later than end date');
    const today = new Date();
    const edOnly = new Date(ed.getFullYear(), ed.getMonth(), ed.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (edOnly > todayOnly) return alert('End date cannot exceed today');
    const diffDays = Math.floor((edOnly.getTime() - new Date(sd.getFullYear(), sd.getMonth(), sd.getDate()).getTime()) / (24*3600*1000)) + 1;
    if (diffDays > 10) return alert('Time span cannot exceed 10 days');

    const params: SearchParams = { mode, startDate, endDate, format };
    if (mode === 'country') {
      if (!country) return alert('Please enter a country code');
      params.country = country.toUpperCase();
    } else {
      if (!west || !south || !east || !north) return alert('Please enter complete geographic boundary coordinates');
      params.west = parseFloat(west);
      params.south = parseFloat(south);
      params.east = parseFloat(east);
      params.north = parseFloat(north);
    }
    if (dataset && dataset !== 'auto') params.sourcePriority = dataset;
    onSearch(params);
  };

  return (
    <Paper elevation={6} sx={{ p: 2, width: 360, maxWidth: '100%' }}>
      <Box component="form" onSubmit={handleSubmit}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Query Mode
        </Typography>
        <FormControl fullWidth>
          <RadioGroup row value={mode} onChange={(e) => setMode(e.target.value as 'country' | 'bbox')}>
            <FormControlLabel value="country" control={<Radio size="small"/>} label="Country" />
            <FormControlLabel value="bbox" control={<Radio size="small"/>} label="Bounding Box" />
          </RadioGroup>
        </FormControl>

        {mode === 'country' ? (
          <Box sx={{ mt: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">Country ISO3</Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="e.g., USA"
              inputProps={{ maxLength: 3, style: { textTransform: 'uppercase', letterSpacing: '2px' } }}
              value={country}
              onChange={(e) => setCountry(e.target.value.toUpperCase())}
            />
          </Box>
        ) : (
          <Box sx={{ mt: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">Bounding Box</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
              <TextField fullWidth size="small" type="number" label="West" value={west} onChange={(e) => setWest(e.target.value)} />
              <TextField fullWidth size="small" type="number" label="South" value={south} onChange={(e) => setSouth(e.target.value)} />
              <TextField fullWidth size="small" type="number" label="East" value={east} onChange={(e) => setEast(e.target.value)} />
              <TextField fullWidth size="small" type="number" label="North" value={north} onChange={(e) => setNorth(e.target.value)} />
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 1.5 }} />

        <Typography variant="subtitle2" color="text.secondary">Date Range</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
          <TextField fullWidth size="small" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <TextField fullWidth size="small" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </Box>

        <Box sx={{ mt: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">Dataset (optional)</Typography>
          <FormControl fullWidth size="small">
            <Select value={dataset} onChange={(e) => setDataset(e.target.value)}>
              <MenuItem value="auto">Auto (recommended)</MenuItem>
              <MenuItem value="VIIRS_SNPP_NRT">VIIRS SNPP NRT</MenuItem>
              <MenuItem value="VIIRS_NOAA21_NRT">VIIRS NOAA21 NRT</MenuItem>
              <MenuItem value="VIIRS_NOAA20_NRT">VIIRS NOAA20 NRT</MenuItem>
              <MenuItem value="MODIS_NRT">MODIS NRT</MenuItem>
              <MenuItem value="VIIRS_NOAA20_SP">VIIRS NOAA20 SP</MenuItem>
              <MenuItem value="VIIRS_SNPP_SP">VIIRS SNPP SP</MenuItem>
              <MenuItem value="MODIS_SP">MODIS SP</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ mt: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">Return Format</Typography>
          <FormControl fullWidth size="small">
            <Select value={format} onChange={(e) => setFormat(e.target.value as 'geojson' | 'json')}>
              <MenuItem value="geojson">GeoJSON</MenuItem>
              <MenuItem value="json">JSON (legacy)</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
          Query
        </Button>
      </Box>
    </Paper>
  );
};

export default SearchForm;
