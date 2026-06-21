import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout/Layout'
import Dashboard from '@/pages/Dashboard/Dashboard'
import Items from '@/pages/Items/Items'
import ItemDetail from '@/pages/ItemDetail/ItemDetail'
import Listings from '@/pages/Listings/Listings'
import Sales from '@/pages/Sales/Sales'
import Stats from '@/pages/Stats/Stats'

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/items" element={<Items />} />
          <Route path="/items/:id" element={<ItemDetail />} />
          <Route path="/listings" element={<Listings />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/stats" element={<Stats />} />
        </Routes>
      </Layout>
    </Router>
  )
}
