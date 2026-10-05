import { useMemo } from 'react'
import Fish from './Fish'

// Pure deterministic pseudo-random generator based on seed
const seedRandom = (seed) => {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

export default function SchoolOfFish() {
  // Generate a fixed list of 12 fish configurations using useMemo deterministically
  const fishes = useMemo(() => {
    const fishArray = []
    // Muted, natural marine and warm tones that blend harmoniously with warm evening lighting
    const fishColors = [
      '#c47d4e', // Soft natural clownfish amber
      '#ded0b8', // Warm sandy pearl
      '#708b99', // Dusty ocean slate
      '#b87063', // Muted coral rose
      '#a6774e', // Soft warm bronze
      '#749688', // Subtle sage teal
      '#6b7a94', // Dusty twilight blue
      '#b8935c', // Warm ochre
      '#ab634f', // Soft terracotta
      '#c9cdd4'  // Silvery mist
    ]

    for (let i = 0; i < 10; i++) {
      // Deterministically generate initialX and speed using index-based seeds
      const randX = seedRandom(i * 12.34)
      const randSpeed = seedRandom(i * 56.78)
      
      fishArray.push({
        id: i,
        // Distinct starting coordinate offset between -3 and 3
        initialX: randX * 6 - 3,
        // Randomized speed modifier between 0.225 and 0.585 (travels slower)
        speed: (0.5 + randSpeed * 0.8) * 0.45,
        color: fishColors[i % fishColors.length],
        startFromRight: i % 2 === 0
      })
    }
    return fishArray
  }, [])

  return (
    <>
      {fishes.map((fish) => (
        <Fish
          key={fish.id}
          initialX={fish.initialX}
          speed={fish.speed}
          color={fish.color}
          startFromRight={fish.startFromRight}
        />
      ))}
    </>
  )
}
