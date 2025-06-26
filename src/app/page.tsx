'use client'

import React, { useState } from 'react'
import { SearchForm } from './components/SearchForm'
import { SearchProgress } from './components/SearchProgress'
import { ReputationReport } from './components/ReputationReport'
import {
  TargetPerson,
  ReputationReport as ReputationReportType,
  SearchProgress as SearchProgressType,
} from './types'

type AppState = 'search' | 'loading' | 'report'

export default function Home() {
  const [appState, setAppState] = useState<AppState>('search')
  const [searchProgress, setSearchProgress] = useState<SearchProgressType>({
    stage: 'collecting',
    progress: 0,
    message: 'Initializing search...',
  })
  const [report, setReport] = useState<ReputationReportType | null>(null)

  const handleSearch = async (targetPerson: TargetPerson) => {
    setAppState('loading')

    try {
      // Call the API to generate the report
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetPerson }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate report')
      }

      // For now, simulate the progress
      const stages = [
        {
          stage: 'collecting',
          message: 'Collecting data from public sources...',
          duration: 2000,
        },
        {
          stage: 'searching',
          message: 'Searching across social media platforms...',
          duration: 3000,
        },
        {
          stage: 'analyzing',
          message: 'Running AI analysis on collected data...',
          duration: 4000,
        },
        {
          stage: 'generating',
          message: 'Generating comprehensive report...',
          duration: 2000,
        },
      ]

      let totalProgress = 0
      const progressPerStage = 100 / stages.length

      for (let i = 0; i < stages.length; i++) {
        const stage = stages[i]
        setSearchProgress({
          stage: stage.stage,
          progress: totalProgress,
          message: stage.message,
        })

        const startProgress = totalProgress
        const endProgress = totalProgress + progressPerStage
        const steps = 10
        const stepDuration = stage.duration / steps

        for (let step = 0; step < steps; step++) {
          await new Promise((resolve) => setTimeout(resolve, stepDuration))
          const currentProgress =
            startProgress + ((endProgress - startProgress) * (step + 1)) / steps
          setSearchProgress((prev) => ({
            ...prev,
            progress: currentProgress,
          }))
        }

        totalProgress = endProgress
      }

      const reportData = await response.json()
      setReport(reportData)
      setAppState('report')
    } catch (error) {
      console.error('Error generating report:', error)
      // Handle error state
    }
  }

  const handleNewSearch = () => {
    setAppState('search')
    setReport(null)
    setSearchProgress({
      stage: 'collecting',
      progress: 0,
      message: 'Initializing search...',
    })
  }

  return (
    <div className='min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col'>
      <div className='flex-1 w-full'>
        {appState === 'search' && (
          <div className='h-full flex items-center justify-center p-4 sm:p-6 lg:p-8'>
            <div className='w-full max-w-2xl'>
              <SearchForm onSubmit={handleSearch} />
            </div>
          </div>
        )}

        {appState === 'loading' && (
          <div className='h-full flex items-center justify-center p-4 sm:p-6 lg:p-8'>
            <div className='w-full max-w-2xl'>
              <SearchProgress progress={searchProgress} />
            </div>
          </div>
        )}

        {appState === 'report' && report && (
          <div className='w-full'>
            <div className='sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200 p-4'>
              <div className='max-w-4xl mx-auto flex justify-center'>
                <button
                  onClick={handleNewSearch}
                  className='bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors font-medium'
                >
                  New Search
                </button>
              </div>
            </div>
            <div className='p-4 sm:p-6 lg:p-8'>
              <ReputationReport report={report} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
