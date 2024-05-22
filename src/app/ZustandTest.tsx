"use client"

import { ReactNode } from "react"
import { create } from "zustand"

type Store = {
  // State
  bears: { name: string; age: number }

  // Actions
  setName: (name: string) => void
  setAge: (age: number) => void
}

const useStore = create<Store>()((setState, getState) => ({
  bears: {
    name: "Justice",
    age: 24,
  },
  setName: (name: string) => setState({ bears: { ...getState().bears, name } }),
  setAge: (age: number) => setState({ bears: { name: getState().bears.name, age } }),
}))

let renderCount = 0

const setName = useStore.getState().setName

export default function ZustandTest() {
  const setAge = useStore((state) => state.setAge)
  console.log("Render count", ++renderCount)

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 gap-4">
      <div className="grid grid-cols-3 gap-2">
        <Button onClick={() => setName("name" + Date.now())}>Change Name</Button>
        <Button onClick={() => setAge(Date.now())}>Change Age</Button>
      </div>

      <div className="flex gap-3">
        <Name />
        <Age />
      </div>
    </main>
  )
}

const Name = () => {
  const name = useStore((state) => state.bears.name)
  console.log({ name })
  return <Button>Name: {name}</Button>
}

const Age = () => {
  const age = useStore((state) => state.bears.age)
  console.log({ age })
  return <Button>Age: {age}</Button>
}

const Button = ({ children, onClick }: { onClick?: () => void; children?: ReactNode }) => (
  <button className="bg-green-500 p-3 text-lg" onClick={onClick}>
    {children}
  </button>
)
