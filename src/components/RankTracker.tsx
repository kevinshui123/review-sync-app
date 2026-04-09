import React, { useState, useEffect } from 'react';
import { Calendar, Lightbulb, TrendingUp, TrendingDown, Minus, Search, Loader2, MapPin, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import Markdown from 'react-markdown';

interface GridPoint {
  lat: number;
  lng: number;
  row: number;
  col: number;
  rank?: number;
  loading?: boolean;
}

interface PlaceResult {
  title: string;
  address: string;
  lat: number;
  lng: number;
  place_id: string;
}

// Component to update map center when centerLat/Lng changes
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export function RankTracker() {
  const [keyword, setKeyword] = useState('Mahjong near me');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  
  const [businessName, setBusinessName] = useState('');
  const [centerLat, setCenterLat] = useState<number | null>(null);
  const [centerLng, setCenterLng] = useState<number | null>(null);
  
  const [radius, setRadius] = useState('1000');
  const [gridSize, setGridSize] = useState(3); // 3x3 grid
  
  const [gridPoints, setGridPoints] = useState<GridPoint[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);

  // Debounced search for places
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/places/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (error) {
        console.error('Failed to search places', error);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const selectPlace = (place: PlaceResult) => {
    setBusinessName(place.title);
    setCenterLat(place.lat);
    setCenterLng(place.lng);
    setSearchQuery(place.title);
    setSearchResults([]);
    setGridPoints([]); // Clear old grid
    setAiInsight(null);
  };

  const generateGrid = (lat: number, lng: number, size: number, radiusMeters: number) => {
    const grid: GridPoint[] = [];
    const latStep = (radiusMeters / 111320) / Math.floor(size / 2); 
    const lngStep = (radiusMeters / (40075000 * Math.cos(lat * Math.PI / 180) / 360)) / Math.floor(size / 2);

    const offset = Math.floor(size / 2);

    for (let i = -offset; i <= offset; i++) {
      for (let j = -offset; j <= offset; j++) {
        grid.push({
          lat: lat + (i * latStep),
          lng: lng + (j * lngStep),
          row: i + offset,
          col: j + offset,
        });
      }
    }
    return grid;
  };

  const generateInsight = async (points: GridPoint[]) => {
    setIsGeneratingInsight(true);
    try {
      const res = await fetch('/api/rank-tracker/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword,
          businessName,
          gridPoints: points
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAiInsight(data.insight);
      } else {
        const err = await res.json();
        setAiInsight(`Error: ${err.error || 'Failed to generate insight'}`);
      }
    } catch (error) {
      console.error('Failed to generate insight', error);
      setAiInsight('Error: Failed to connect to AI service');
    } finally {
      setIsGeneratingInsight(false);
    }
  };

  const handleScan = async () => {
    if (!keyword || !businessName || centerLat === null || centerLng === null) {
      alert('Please search and select a business first, and enter a keyword.');
      return;
    }

    setIsScanning(true);
    setScanProgress(0);
    setAiInsight(null);
    
    const rad = parseFloat(radius);
    
    const initialGrid = generateGrid(centerLat, centerLng, gridSize, rad);
    setGridPoints(initialGrid.map(p => ({ ...p, loading: true })));

    let completed = 0;
    const updatedGrid = [...initialGrid];

    for (let i = 0; i < updatedGrid.length; i++) {
      const point = updatedGrid[i];
      try {
        const res = await fetch('/api/rank-tracker/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            keyword,
            businessName,
            lat: point.lat,
            lng: point.lng
          })
        });
        
        if (res.ok) {
          const data = await res.json();
          updatedGrid[i] = { ...point, rank: data.rank, loading: false };
        } else {
          updatedGrid[i] = { ...point, rank: 21, loading: false };
        }
      } catch (error) {
        console.error('Scan error:', error);
        updatedGrid[i] = { ...point, rank: 21, loading: false };
      }
      
      completed++;
      setScanProgress(Math.round((completed / updatedGrid.length) * 100));
      setGridPoints([...updatedGrid]);
    }

    setIsScanning(false);
    generateInsight(updatedGrid);
  };

  const getAverageRank = () => {
    const validRanks = gridPoints.filter(p => p.rank !== undefined && p.rank <= 20).map(p => p.rank!);
    if (validRanks.length === 0) return '20+';
    return (validRanks.reduce((a, b) => a + b, 0) / validRanks.length).toFixed(1);
  };

  const getVisibilityIndex = () => {
    if (gridPoints.length === 0) return '0%';
    const top3 = gridPoints.filter(p => p.rank !== undefined && p.rank <= 3).length;
    return Math.round((top3 / gridPoints.length) * 100) + '%';
  };

  const getTop10Presence = () => {
    if (gridPoints.length === 0) return 0;
    const top10 = gridPoints.filter(p => p.rank !== undefined && p.rank <= 10).length;
    return Math.round((top10 / gridPoints.length) * 100);
  };

  const getColorForRank = (rank?: number) => {
    if (rank === undefined) return '#64748b'; // slate-500
    if (rank <= 3) return '#10b981'; // emerald-500
    if (rank <= 10) return '#fbbf24'; // amber-400
    return '#f43f5e'; // rose-500
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 md:p-8 space-y-8 max-w-[1400px] mx-auto pb-20"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <span className="text-[10px] text-primary font-bold tracking-widest uppercase block mb-2">Live Rank Analysis</span>
          <h2 className="text-3xl font-black tracking-tight text-on-surface">Geo-Grid Rank Tracker</h2>
          <p className="text-secondary mt-1 max-w-xl text-sm">
            Real-time localized search results powered by SerpApi.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-4 bg-surface-container-low px-4 py-2 rounded-lg border border-outline-variant/10">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
              <span className="text-xs font-medium text-secondary">1-3</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
              <span className="text-xs font-medium text-secondary">4-10</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
              <span className="text-xs font-medium text-secondary">11+</span>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Form */}
      <div className="bg-surface-container rounded-xl p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="space-y-1 relative">
            <label className="text-xs font-bold text-secondary uppercase tracking-wider">Search Business</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="e.g. Mahjong mini bowl"
                className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-lg pl-9 pr-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
              />
              {isSearching && (
                <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-primary animate-spin" />
              )}
            </div>
            
            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-surface-container-high border border-outline-variant/20 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                {searchResults.map((place, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectPlace(place)}
                    className="w-full text-left px-4 py-3 hover:bg-surface-container-highest border-b border-outline-variant/10 last:border-0 transition-colors"
                  >
                    <div className="font-bold text-sm text-on-surface">{place.title}</div>
                    <div className="text-xs text-secondary mt-0.5 truncate">{place.address}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-secondary uppercase tracking-wider">Target Keyword</label>
            <input 
              type="text" 
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder="e.g. Mahjong near me"
              className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-secondary uppercase tracking-wider">Radius (m)</label>
            <input 
              type="number" 
              value={radius}
              onChange={e => setRadius(e.target.value)}
              className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <button 
              onClick={handleScan}
              disabled={isScanning}
              className="w-full bg-primary text-on-primary hover:bg-primary/90 font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {isScanning ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Scanning ({scanProgress}%)</>
              ) : (
                <><Search className="w-4 h-4" /> Run Scan</>
              )}
            </button>
          </div>
        </div>
        
        {businessName && centerLat && centerLng && (
          <div className="mt-4 flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20 inline-flex">
            <Check className="w-4 h-4" />
            <span>Selected: <strong>{businessName}</strong> ({centerLat.toFixed(4)}, {centerLng.toFixed(4)})</span>
          </div>
        )}
      </div>

      {/* Main Bento Grid Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Map Grid Visualization */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container rounded-xl overflow-hidden shadow-2xl relative group min-h-[500px]">
          {centerLat && centerLng ? (
            <div className="absolute inset-0 z-0">
              <MapContainer 
                center={[centerLat, centerLng]} 
                zoom={14} 
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                <MapUpdater center={[centerLat, centerLng]} />
                
                {gridPoints.map((point, idx) => {
                  const isCenter = point.row === Math.floor(gridSize/2) && point.col === Math.floor(gridSize/2);
                  const color = getColorForRank(point.rank);
                  
                  return (
                    <CircleMarker
                      key={idx}
                      center={[point.lat, point.lng]}
                      radius={24}
                      pathOptions={{ 
                        fillColor: color, 
                        color: isCenter ? '#ffffff' : color, 
                        weight: isCenter ? 3 : 1,
                        fillOpacity: point.loading ? 0.3 : 0.8,
                        opacity: 1
                      }}
                    >
                      <Tooltip direction="center" permanent className="bg-transparent border-none shadow-none text-white font-bold text-lg text-shadow">
                        {point.loading ? '...' : (point.rank !== undefined ? (point.rank > 20 ? '20+' : point.rank) : '-')}
                      </Tooltip>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-surface-container">
              <div className="text-center text-secondary">
                <MapPin className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>Search and select a business to view the map.</p>
              </div>
            </div>
          )}

          {/* Grid Overlay Info */}
          {gridPoints.length > 0 && !isScanning && (
            <div className="absolute bottom-6 left-6 z-20 flex gap-4">
              <div className="bg-surface/90 backdrop-blur px-4 py-3 rounded-lg border border-outline-variant/10">
                <p className="text-[10px] text-secondary font-bold tracking-widest uppercase mb-1">Average Rank</p>
                <p className="text-2xl font-bold text-primary">{getAverageRank()}</p>
              </div>
              <div className="bg-surface/90 backdrop-blur px-4 py-3 rounded-lg border border-outline-variant/10">
                <p className="text-[10px] text-secondary font-bold tracking-widest uppercase mb-1">Visibility Index</p>
                <p className="text-2xl font-bold text-primary">{getVisibilityIndex()}</p>
              </div>
            </div>
          )}
        </div>

        {/* Stats Column */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Keyword Metrics Card */}
          <div className="bg-surface-container p-6 rounded-xl border-l-4 border-primary">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-on-surface mb-4">Scan Results</h3>
            <div className="space-y-6">
              <ProgressStat 
                label="Top 3 Presence" 
                value={getVisibilityIndex()} 
                percent={parseInt(getVisibilityIndex()) || 0} 
                color="bg-primary" 
                valueColor="text-primary" 
              />
              <ProgressStat 
                label="Top 10 Presence" 
                value={`${Math.round((gridPoints.filter(p => p.rank !== undefined && p.rank <= 10).length / (gridPoints.length || 1)) * 100)}%`} 
                percent={Math.round((gridPoints.filter(p => p.rank !== undefined && p.rank <= 10).length / (gridPoints.length || 1)) * 100)} 
                color="bg-amber-400" 
                valueColor="text-amber-400" 
              />
            </div>
          </div>

          {/* Recommendation Card */}
          <div className="bg-surface-container-highest p-6 rounded-xl relative overflow-hidden flex flex-col">
            <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none">
              <Lightbulb className="w-32 h-32 text-primary" />
            </div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3 shrink-0">SEO Action Plan</h3>
            <div className="relative z-10 max-h-[400px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
              {isGeneratingInsight ? (
                <div className="flex items-center gap-2 text-secondary text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating AI action plan...
                </div>
              ) : aiInsight ? (
                <div className="text-on-surface text-sm leading-relaxed space-y-3 [&>h1]:text-lg [&>h1]:font-bold [&>h2]:text-base [&>h2]:font-bold [&>h3]:text-sm [&>h3]:font-bold [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>li]:mb-1 [&>p]:mb-2">
                  <Markdown>{aiInsight}</Markdown>
                </div>
              ) : (
                <p className="text-secondary leading-relaxed text-sm">
                  Run a scan to generate a detailed, AI-powered step-by-step action plan based on your local ranking performance.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ProgressStat({ label, value, percent, color, valueColor }: any) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-secondary">{label}</span>
        <span className={`${valueColor} font-bold`}>{value}</span>
      </div>
      <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
        <div className={`${color} h-full transition-all duration-1000`} style={{ width: `${percent}%` }}></div>
      </div>
    </div>
  );
}
