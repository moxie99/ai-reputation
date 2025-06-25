/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import React from 'react'
import {
  CheckCircle,
  Clock,
  Search,
  Database,
  Brain,
  FileText,
} from 'lucide-react'
import { SearchProgress as SearchProgressType } from '../types'

interface SearchProgressProps {
  progress: SearchProgressType
}

export const SearchProgress: React.FC<SearchProgressProps> = ({ progress }) => {
  const stages = [
    { id: 'collecting', label: 'Collecting Data', icon: Database },
    { id: 'searching', label: 'Searching Sources', icon: Search },
    { id: 'analyzing', label: 'AI Analysis', icon: Brain },
    { id: 'generating', label: 'Generating Report', icon: FileText },
  ]

  const currentStageIndex = stages.findIndex(
    (stage) => stage.id === progress.stage
  )

  return (
    <div className='max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8'>
      <div className='text-center mb-8'>
        <div className='inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
        </div>
        <h2 className='text-2xl font-bold text-gray-900 mb-2'>
          Generating Your Report
        </h2>
        <p className='text-gray-600'>{progress.message}</p>
      </div>

      {/* Progress Bar */}
      <div className='mb-8'>
        <div className='flex justify-between text-sm text-gray-600 mb-2'>
          <span>Progress</span>
          <span>{Math.round(progress.progress)}%</span>
        </div>
        <div className='w-full bg-gray-200 rounded-full h-2'>
          <div
            className='bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out'
            style={{ width: `${progress.progress}%` }}
          ></div>
        </div>
      </div>

      {/* Stage Indicators */}
      <div className='space-y-4'>
        {stages.map((stage, index) => {
          const Icon = stage.icon
          const isCompleted = index < currentStageIndex
          const isCurrent = index === currentStageIndex
          const isPending = index > currentStageIndex

          return (
            <div
              key={stage.id}
              className={`flex items-center space-x-4 p-4 rounded-lg transition-colors ${
                isCompleted
                  ? 'bg-green-50 border border-green-200'
                  : isCurrent
                  ? 'bg-blue-50 border border-blue-200'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  isCompleted
                    ? 'bg-green-100 text-green-600'
                    : isCurrent
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className='w-6 h-6' />
                ) : isCurrent ? (
                  <Icon className='w-6 h-6' />
                ) : (
                  <Clock className='w-6 h-6' />
                )}
              </div>
              <div className='flex-1'>
                <h3
                  className={`font-medium ${
                    isCompleted
                      ? 'text-green-900'
                      : isCurrent
                      ? 'text-blue-900'
                      : 'text-gray-500'
                  }`}
                >
                  {stage.label}
                </h3>
                {isCurrent && (
                  <p className='text-sm text-blue-600 mt-1'>
                    {progress.message}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className='mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
        <p className='text-sm text-yellow-800'>
          <strong>Note:</strong> This process typically takes 2-5 minutes
          depending on data availability and analysis complexity.
        </p>
      </div>
    </div>
  )
}
