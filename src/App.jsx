import { useState, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Terminal, Activity, Star, GitFork, Users, Filter, ArrowUpDown, Sparkles, Code2, Award, Download, Flame, Trophy, Calendar, GitCommit, Link, Check } from 'lucide-react'
import axios from 'axios'
import { GitHubCalendar } from 'react-github-calendar'
import { toPng } from 'html-to-image'

const LANGUAGE_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  'C++': '#f34b7d',
  'C#': '#178600',
  Ruby: '#701516',
  Go: '#00ADD8',
  Rust: '#dea584',
  HTML: '#e34c26',
  CSS: '#563d7c',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
}

function App() {
  const [username, setUsername] = useState('')
  const [userData, setUserData] = useState(null)
  const [allRepos, setAllRepos] = useState([])
  const [languageStats, setLanguageStats] = useState([])
  const [badges, setBadges] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [streakStats, setStreakStats] = useState(null)
  const [repoCommits, setRepoCommits] = useState([])
  const [copied, setCopied] = useState(false)
  
  const profileRef = useRef(null)
  
  const [sortBy, setSortBy] = useState('updated') // 'updated', 'stars', 'forks'
  const [filterLang, setFilterLang] = useState('All')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userParam = params.get('user');
    if (userParam) {
      setUsername(userParam);
      fetchGithubData(null, userParam);
    }
  }, []);

  const fetchGithubData = async (e, customUsername = null) => {
    if (e) e.preventDefault()
    
    const targetUser = customUsername || username;
    if (!targetUser.trim()) return

    setLoading(true)
    setError('')
    setUserData(null)
    setAllRepos([])
    setLanguageStats([])
    setBadges([])
    setStreakStats(null)
    setRepoCommits([])

    const newUrl = `${window.location.pathname}?user=${targetUser}`;
    window.history.pushState({ path: newUrl }, '', newUrl);

    try {
      // Free REST API limit: 60 requests/hr (unauthenticated)
      const userRes = await axios.get(`https://api.github.com/users/${targetUser}`)
      setUserData(userRes.data)

      const repoRes = await axios.get(
        `https://api.github.com/users/${targetUser}/repos?sort=updated&per_page=100`
      )
      
      const fetchedRepos = repoRes.data
      setAllRepos(fetchedRepos)

      // Calculate languages
      const langs = {}
      let totalLangs = 0
      fetchedRepos.forEach(repo => {
        if (repo.language) {
          langs[repo.language] = (langs[repo.language] || 0) + 1
          totalLangs++
        }
      })
      
      const sortedLangs = Object.entries(langs)
        .map(([name, count]) => ({
          name,
          count,
          percentage: ((count / totalLangs) * 100).toFixed(1),
          color: LANGUAGE_COLORS[name] || '#58a6ff'
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5) 
        
      setLanguageStats(sortedLangs)

      // Calculate Badges
      const newBadges = []
      const totalStars = fetchedRepos.reduce((sum, repo) => sum + repo.stargazers_count, 0)
      
      if (totalStars > 100) newBadges.push({ title: 'Star Magnet', icon: Sparkles, color: 'text-yellow-400', border: 'border-yellow-400/30', bg: 'bg-yellow-400/10' })
      else if (totalStars > 10) newBadges.push({ title: 'Rising Star', icon: Star, color: 'text-yellow-200', border: 'border-yellow-200/30', bg: 'bg-yellow-200/10' })

      if (Object.keys(langs).length >= 5) newBadges.push({ title: 'Polyglot', icon: Code2, color: 'text-purple-400', border: 'border-purple-400/30', bg: 'bg-purple-400/10' })

      if (userRes.data.followers >= 40) newBadges.push({ title: 'Influencer', icon: Users, color: 'text-blue-400', border: 'border-blue-400/30', bg: 'bg-blue-400/10' })

      const maxForks = fetchedRepos.length > 0 ? Math.max(...fetchedRepos.map(r => r.forks_count)) : 0
      if (maxForks >= 10) newBadges.push({ title: 'Fork Master', icon: GitFork, color: 'text-green-400', border: 'border-green-400/30', bg: 'bg-green-400/10' })

      if (fetchedRepos.length >= 30) newBadges.push({ title: 'Active Coder', icon: Terminal, color: 'text-emerald-400', border: 'border-emerald-400/30', bg: 'bg-emerald-400/10' })

      if (newBadges.length === 0) newBadges.push({ title: 'Explorer', icon: Award, color: 'text-gray-400', border: 'border-gray-400/30', bg: 'bg-gray-400/10' })

      setBadges(newBadges)

      // Fetch contribution stats
      try {
        const contribRes = await axios.get(`https://github-contributions-api.deno.dev/${targetUser}.json`);
        
        if (contribRes.data && contribRes.data.contributions) {
          const totalContributions = contribRes.data.totalContributions || 0;
          const days = contribRes.data.contributions.flat();
          
          let current = 0;
          let best = 0;
          
          days.forEach(day => {
            if (day.contributionCount > 0) {
              current++;
              if (current > best) best = current;
            } else {
              current = 0;
            }
          });
          
          let currentStreak = 0;
          const todayIndex = days.length - 1;
          for (let i = todayIndex; i >= 0; i--) {
            if (days[i].contributionCount > 0) {
              currentStreak++;
            } else {
              if (i === todayIndex) continue;
              break;
            }
          }
          
          setStreakStats({ currentStreak, bestStreak: best, totalContributions });
        }
      } catch (err) {
        console.error("Could not fetch contributions for streak stats", err);
      }

      // Fetch commits for top 10 most starred repos
      try {
        const top10Repos = [...fetchedRepos]
          .sort((a, b) => b.stargazers_count - a.stargazers_count)
          .slice(0, 10);
        
        const commitPromises = top10Repos.map(async (repo) => {
          try {
            const res = await axios.get(`https://api.github.com/repos/${targetUser}/${repo.name}/commits?per_page=1`);
            let count = res.data.length;
            const link = res.headers.link;
            if (link) {
              const match = link.match(/page=(\d+)>; rel="last"/);
              if (match) count = parseInt(match[1], 10);
            }
            return { name: repo.name, commits: count };
          } catch (e) {
            return { name: repo.name, commits: 0 };
          }
        });
        
        const commitsData = await Promise.all(commitPromises);
        setRepoCommits(commitsData.sort((a, b) => b.commits - a.commits).filter(r => r.commits > 0));
      } catch (err) {
        console.error("Could not fetch commits data", err);
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setError('User not found.')
      } else if (err.response && err.response.status === 403) {
        setError('API rate limit exceeded. Please try again later or add a token.')
      } else {
        setError('Failed to fetch data.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Compute displayed repos based on filter and sort
  const displayedRepos = useMemo(() => {
    return allRepos
      .filter(repo => filterLang === 'All' || repo.language === filterLang)
      .sort((a, b) => {
        if (sortBy === 'stars') return b.stargazers_count - a.stargazers_count
        if (sortBy === 'forks') return b.forks_count - a.forks_count
        return new Date(b.updated_at) - new Date(a.updated_at)
      })
      .slice(0, 10) // Show top 10
  }, [allRepos, filterLang, sortBy])

  const downloadProfileCard = async () => {
    if (!profileRef.current) return
    try {
      setDownloading(true)
      // Set background color explicitly for html-to-image to avoid transparency issues
      const dataUrl = await toPng(profileRef.current, { 
        cacheBust: true,
        backgroundColor: '#161b22', // Match --color-surface
        style: { transform: 'scale(1)', margin: '0' }
      })
      const link = document.createElement('a')
      link.download = `${userData.login}-github-card.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Failed to generate image', err)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="min-h-screen p-6 md:p-12 flex flex-col items-center">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-3xl flex flex-col items-center gap-8"
      >
        <div className="flex items-center gap-3 text-primary mb-2">
          <Terminal size={40} />
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">GitHub Visualizer</h1>
        </div>
        
        <p className="text-text-muted text-center text-lg max-w-lg">
          Visualize your GitHub profile with interactive data, repos, and activity.
        </p>

        {/* Search Bar */}
        <form 
          onSubmit={fetchGithubData}
          className="w-full flex items-center glass-panel p-2 pl-6 focus-within:border-primary/50 transition-colors duration-300"
        >
          <Search className="text-text-muted" size={20} />
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter GitHub Username..."
            className="w-full bg-transparent border-none outline-none text-text px-4 py-3 placeholder:text-text-muted/60"
          />
          <button 
            type="submit"
            disabled={loading || !username.trim()}
            className="bg-primary text-background px-6 py-3 rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50 transition-all active:scale-95"
          >
            {loading ? 'Searching...' : 'Visualize'}
          </button>
        </form>

        {error && (
          <motion.p 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-red-400 bg-red-400/10 px-4 py-2 rounded-lg border border-red-400/20"
          >
            {error}
          </motion.p>
        )}

        {/* Results Area */}
        {userData && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full space-y-8"
          >
            {/* Profile Card */}
            <div className="relative">
              <div className="absolute top-4 right-4 z-20 flex gap-2">
                <button
                  onClick={() => {
                    const url = `${window.location.origin}${window.location.pathname}?user=${userData.login}`;
                    navigator.clipboard.writeText(url);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="bg-background/80 hover:bg-primary hover:text-white text-text-muted p-2 rounded-lg backdrop-blur transition-all"
                  title="Copy Profile Link"
                >
                  {copied ? <Check size={20} className="text-green-400" /> : <Link size={20} />}
                </button>
                <button
                  onClick={downloadProfileCard}
                  disabled={downloading}
                  className="bg-background/80 hover:bg-primary hover:text-white text-text-muted p-2 rounded-lg backdrop-blur transition-all disabled:opacity-50"
                  title="Download Profile Card"
                >
                  <Download size={20} className={downloading ? 'animate-bounce' : ''} />
                </button>
              </div>

              <div 
                ref={profileRef}
                className="glass-panel p-8 flex flex-col md:flex-row gap-8 items-center md:items-start relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-purple-500" />
              
              <img 
                src={userData.avatar_url} 
                alt={userData.name || userData.login} 
                className="w-32 h-32 rounded-full border-4 border-surface shadow-lg z-10"
              />
              
              <div className="flex-1 text-center md:text-left z-10">
                <h2 className="text-3xl font-bold text-white mb-2">
                  {userData.name || userData.login}
                </h2>
                <a 
                  href={userData.html_url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-primary hover:underline mb-4 inline-block"
                >
                  @{userData.login}
                </a>
                <p className="text-text-muted max-w-md">
                  {userData.bio || 'No bio provided.'}
                </p>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-6">
                  <div className="flex items-center gap-2 bg-background/50 px-3 py-1.5 rounded-lg border border-border/50">
                    <Users size={16} className="text-text-muted" />
                    <span><strong className="text-white">{userData.followers}</strong> followers</span>
                  </div>
                  <div className="flex items-center gap-2 bg-background/50 px-3 py-1.5 rounded-lg border border-border/50">
                    <Activity size={16} className="text-text-muted" />
                    <span><strong className="text-white">{userData.public_repos}</strong> repos</span>
                  </div>
                </div>

                {/* Badges */}
                {badges.length > 0 && (
                  <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-6">
                    {badges.map((badge, i) => {
                      const Icon = badge.icon
                      return (
                        <motion.div
                          key={badge.title}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.1 }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${badge.border} ${badge.bg} ${badge.color} text-xs font-semibold shadow-sm cursor-default`}
                          title={badge.title}
                        >
                          <Icon size={14} />
                          {badge.title}
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
            </div>

            {/* Language Stats */}
            {languageStats.length > 0 && (
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="glass-panel p-8"
              >
                <h3 className="text-xl font-semibold mb-6 text-white">Top Languages</h3>
                
                {/* Progress Bar */}
                <div className="w-full h-3 bg-surface rounded-full overflow-hidden flex mb-6 shadow-inner">
                  {languageStats.map((lang) => (
                    <motion.div 
                      key={lang.name}
                      initial={{ width: 0 }}
                      animate={{ width: `${lang.percentage}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                      style={{ backgroundColor: lang.color }}
                      className="h-full hover:brightness-110 cursor-pointer"
                      title={`${lang.name}: ${lang.percentage}%`}
                    />
                  ))}
                </div>

                {/* Legends */}
                <div className="flex flex-wrap gap-6">
                  {languageStats.map((lang) => (
                    <div key={lang.name} className="flex items-center gap-2 text-sm text-text-muted">
                      <span 
                        className="w-3 h-3 rounded-full shadow-sm" 
                        style={{ backgroundColor: lang.color }}
                      />
                      <span className="font-medium text-white">{lang.name}</span>
                      <span>{lang.percentage}%</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* GitHub Stats Section */}
            {streakStats && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full"
              >
                <div className="glass-panel p-4 md:px-6 flex items-center gap-4 relative overflow-hidden group transition-all hover:-translate-y-1">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400 z-10 shrink-0">
                    <Calendar size={22} />
                  </div>
                  <div className="flex flex-col z-10">
                    <p className="text-text-muted text-[11px] uppercase font-bold tracking-wider mb-1">Total Contribution</p>
                    <h4 className="text-2xl font-bold text-white leading-none">{streakStats.totalContributions}</h4>
                  </div>
                </div>

                <div className="glass-panel p-4 md:px-6 flex items-center gap-4 relative overflow-hidden group transition-all hover:-translate-y-1">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="p-2.5 bg-orange-500/10 rounded-xl border border-orange-500/20 text-orange-400 z-10 shrink-0">
                    <Flame size={22} />
                  </div>
                  <div className="flex flex-col z-10">
                    <p className="text-text-muted text-[11px] uppercase font-bold tracking-wider mb-1">Current Streak</p>
                    <h4 className="text-2xl font-bold text-white leading-none">{streakStats.currentStreak} <span className="text-sm font-medium text-text-muted">days</span></h4>
                  </div>
                </div>

                <div className="glass-panel p-4 md:px-6 flex items-center gap-4 relative overflow-hidden group transition-all hover:-translate-y-1">
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="p-2.5 bg-yellow-500/10 rounded-xl border border-yellow-500/20 text-yellow-400 z-10 shrink-0">
                    <Trophy size={22} />
                  </div>
                  <div className="flex flex-col z-10">
                    <p className="text-text-muted text-[11px] uppercase font-bold tracking-wider mb-1">Best Streak</p>
                    <h4 className="text-2xl font-bold text-white leading-none">{streakStats.bestStreak} <span className="text-sm font-medium text-text-muted">days</span></h4>
                  </div>
                </div>
              </motion.div>
            )}

            {/* GitHub Contribution Calendar */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="glass-panel p-8 overflow-hidden w-full flex flex-col items-center"
            >
              <h3 className="text-xl font-semibold mb-6 text-white w-full text-left">Contribution Graph</h3>
              <div className="w-full overflow-x-auto pb-2 flex justify-center text-white">
                <GitHubCalendar 
                  username={userData.login} 
                  colorScheme="dark"
                  theme={{
                    dark: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'] // Classic GitHub Dark Mode Green
                  }}
                  blockSize={14}
                  blockMargin={5}
                  fontSize={14}
                />
              </div>
            </motion.div>

            {/* Top 10 Repos by Commits */}
            {repoCommits.length > 0 && (
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="glass-panel p-8 w-full"
              >
                <div className="flex items-center gap-3 mb-6">
                  <GitCommit size={24} className="text-primary" />
                  <h3 className="text-xl font-semibold text-white">Commits per Repo (Top 10)</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {repoCommits.map((repo, i) => {
                    const maxCommits = Math.max(...repoCommits.map(r => r.commits)) || 1;
                    const percentage = (repo.commits / maxCommits) * 100;
                    
                    return (
                      <motion.div 
                        key={repo.name}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: i * 0.05 }}
                        className="bg-surface/40 border border-border/50 rounded-xl p-4 hover:border-primary/40 hover:bg-surface/60 transition-all group relative overflow-hidden flex flex-col justify-center"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="flex justify-between items-center mb-3 relative z-10">
                          <span className="text-white font-semibold truncate max-w-[70%] group-hover:text-primary transition-colors text-sm">{repo.name}</span>
                          <div className="flex items-center gap-1.5 bg-background/60 px-2 py-1 rounded-md border border-border/40">
                            <GitCommit size={14} className="text-text-muted group-hover:text-primary transition-colors" />
                            <span className="text-text-muted text-xs font-medium group-hover:text-white transition-colors">{repo.commits}</span>
                          </div>
                        </div>
                        <div className="w-full h-1.5 bg-background/80 rounded-full overflow-hidden relative z-10 shadow-inner">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 1, delay: 0.2 + (0.1 * i) }}
                            className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full relative"
                          >
                            <div className="absolute inset-0 bg-white/20 blur-[2px]" />
                          </motion.div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* Filter and Sort Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center mt-12 mb-6 gap-4">
              <h3 className="text-2xl font-semibold w-full md:w-auto text-left">Repositories</h3>
              
              <div className="flex flex-wrap gap-4 w-full md:w-auto">
                <div className="flex items-center bg-surface border border-border/50 rounded-xl px-3 py-2">
                  <Filter size={16} className="text-text-muted mr-2" />
                  <select 
                    value={filterLang}
                    onChange={(e) => setFilterLang(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm text-white cursor-pointer"
                  >
                    <option value="All" className="bg-surface text-white">All Languages</option>
                    {languageStats.map(lang => (
                      <option key={lang.name} value={lang.name} className="bg-surface text-white">{lang.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center bg-surface border border-border/50 rounded-xl px-3 py-2">
                  <ArrowUpDown size={16} className="text-text-muted mr-2" />
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm text-white cursor-pointer"
                  >
                    <option value="updated" className="bg-surface text-white">Recently Updated</option>
                    <option value="stars" className="bg-surface text-white">Most Stars</option>
                    <option value="forks" className="bg-surface text-white">Most Forks</option>
                  </select>
                </div>
              </div>
            </div>

            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {displayedRepos.map((repo) => (
                  <motion.a
                    href={repo.html_url}
                    target="_blank"
                    rel="noreferrer"
                    key={repo.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="glass-panel p-6 hover:border-primary/40 transition-colors group cursor-pointer block"
                  >
                    <h4 className="text-lg font-semibold text-white group-hover:text-primary transition-colors mb-2 truncate">
                      {repo.name}
                    </h4>
                    <p className="text-text-muted text-sm mb-4 line-clamp-2 min-h-[40px]">
                      {repo.description || 'No description available.'}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-text-muted">
                      {repo.language && (
                        <span className="flex items-center gap-1.5">
                          <span 
                            className="w-2.5 h-2.5 rounded-full" 
                            style={{ backgroundColor: LANGUAGE_COLORS[repo.language] || '#58a6ff' }}
                          />
                          {repo.language}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Star size={14} /> {repo.stargazers_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <GitFork size={14} /> {repo.forks_count}
                      </span>
                    </div>
                  </motion.a>
                ))}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

export default App
