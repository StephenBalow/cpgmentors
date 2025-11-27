export default function CPGDashboardPage({ params }: { params: { slug: string } }) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">CPG Dashboard: {params.slug}</h1>
      <p className="text-gray-500 mt-2">Screen 10: Landing page for this CPG</p>
    </div>
  )
}