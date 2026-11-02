import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Navigate, NavLink, Outlet, Route, Routes, useLocation } from 'react-router'
import { useAuth } from './auth/AuthProvider'
import { Icon, type IconName } from './components/Icon'
import { useData } from './data/store'
import { Hearts } from './screens/Hearts'
import { PersonDetail } from './screens/PersonDetail'
import { PersonEditor } from './screens/PersonEditor'
import { Stories } from './screens/Stories'
import { StoryDetail } from './screens/StoryDetail'
import { StoryEditor } from './screens/StoryEditor'
import { Welcome } from './screens/Welcome'
import { You } from './screens/You'

// The map and its d3 code only load when the Map tab is opened (still precached for offline use).
const MapScreen = lazy(() => import('./screens/MapScreen').then((m) => ({ default: m.MapScreen })))

export function App() {
  const { state } = useAuth()
  const data = useData()

  if (state.status === 'loading') return <Splash />
  if (state.status === 'signedOut') return <Welcome />
  if (!data) return <Splash />

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<TabsLayout />}>
          <Route index element={<Hearts />} />
          <Route path="stories" element={<Stories />} />
          <Route
            path="map"
            element={
              <Suspense fallback={<main className="page" aria-busy="true" />}>
                <MapScreen />
              </Suspense>
            }
          />
          <Route path="you" element={<You />} />
        </Route>
        <Route path="people/new" element={<PersonEditor />} />
        <Route path="people/:id" element={<PersonDetail />} />
        <Route path="people/:id/edit" element={<PersonEditor />} />
        <Route path="stories/new" element={<StoryEditor />} />
        <Route path="stories/:id" element={<StoryDetail />} />
        <Route path="stories/:id/edit" element={<StoryEditor />} />
        {state.status === 'device' && <Route path="sign-in" element={<Welcome upgrade />} />}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

const TABS: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Hearts', icon: 'heart' },
  { to: '/stories', label: 'Stories', icon: 'book' },
  { to: '/map', label: 'Map', icon: 'globe' },
  { to: '/you', label: 'You', icon: 'user' },
]

function TabsLayout() {
  return (
    <>
      <Outlet />
      <nav className="tabbar" aria-label="Main">
        <div className="tabbar__inner">
          {TABS.map((tab) => (
            <NavLink key={tab.to} to={tab.to} end={tab.to === '/'} className="tabbar__item">
              {({ isActive }) => (
                <>
                  <Icon name={tab.icon} filled={isActive && tab.icon === 'heart'} strokeWidth={isActive ? 2.2 : 1.9} />
                  <span>{tab.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    // Braces matter: newer Chrome returns a Promise from scrollTo, which React would treat as a cleanup.
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function Splash() {
  return <div className="splash" aria-busy="true" />
}
