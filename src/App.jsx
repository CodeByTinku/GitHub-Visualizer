import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Terminal, Activity, Star, GitFork, Users } from 'lucide-react'
import axios from 'axios'

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
  const [repos, setRepos] = useState([])
  const [languageStats, setLanguageStats] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchGithubData = async (e) => {
    e.preventDefault()
    if (!username.trim()) return

    setLoading(true)
    setError('')
    setUserData(null)
    setRepos([])
    setLanguageStats([])

    try {
      // Free REST API limit: 60 requests/hr (unauthenticated)
      const userRes = await axios.get(`https://api.github.com/users/${username}`)
      setUserData(userRes.data)

      const repoRes = await axios.get(
        `https://api.github.com/users/${username}/repos?sort=updated&per_page=100`
      )
      
      const allRepos = repoRes.data
      setRepos(allRepos.slice(0, 6))

      // Calculate languages
      const langs = {}
      let totalLangs = 0
      allRepos.forEach(repo => {
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
        .slice(0, 5) // Top 5 languages
        
      setLanguageStats(sortedLangs)
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
            <div className="glass-panel p-8 flex flex-col md:flex-row gap-8 items-center md:items-start relative overflow-hidden">
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

            {/* Repos Grid */}
            <h3 className="text-2xl font-semibold mt-12 mb-6">Recent Repositories</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {repos.map((repo, i) => (
                <motion.a
                  href={repo.html_url}
                  target="_blank"
                  rel="noreferrer"
                  key={repo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
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
                        <span className="w-2.5 h-2.5 rounded-full bg-primary" />
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
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

export default App
