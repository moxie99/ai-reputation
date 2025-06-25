/* eslint-disable react/no-unescaped-entities */
'use client'

import React from 'react'
import { format } from 'date-fns'
import {
  User,
  Calendar,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Info,
  Download,
  Share2,
} from 'lucide-react'
import {
  ReputationReport as ReputationReportType,
  FlaggedContent,
} from '../types'

interface ReputationReportProps {
  report: ReputationReportType
}

export const ReputationReport: React.FC<ReputationReportProps> = ({
  report,
}) => {
  const getSeverityColor = (severity: FlaggedContent['severity']) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getSeverityIcon = (severity: FlaggedContent['severity']) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className='w-4 h-4' />
      case 'medium':
        return <Info className='w-4 h-4' />
      case 'low':
        return <CheckCircle className='w-4 h-4' />
      default:
        return <Info className='w-4 h-4' />
    }
  }

  const categories = Object.entries(report.categories)

  return (
    <div className='max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden'>
      {/* Header */}
      <div className='bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <div className='w-16 h-16 bg-white/20 rounded-full flex items-center justify-center'>
              <User className='w-8 h-8' />
            </div>
            <div>
              <h1 className='text-3xl font-bold'>{report.targetPerson.name}</h1>
              <div className='flex items-center space-x-4 mt-2 text-blue-100'>
                <div className='flex items-center space-x-1'>
                  <Calendar className='w-4 h-4' />
                  <span className='text-sm'>
                    Generated{' '}
                    {format(new Date(report.generatedAt), 'MMM dd, yyyy')}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className='flex space-x-2'>
            <button className='bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors'>
              <Download className='w-4 h-4' />
              <span>Export</span>
            </button>
            <button className='bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors'>
              <Share2 className='w-4 h-4' />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      <div className='p-8'>
        {/* Overall Summary */}
        <div className='mb-8 p-6 bg-gray-50 rounded-xl'>
          <h2 className='text-xl font-bold text-gray-900 mb-4'>
            Executive Summary
          </h2>
          <p className='text-gray-700 leading-relaxed'>
            {report.overallSummary}
          </p>
        </div>

        {/* Analysis Categories */}
        <div className='space-y-8'>
          {categories.map(([categoryKey, category]) => (
            <div
              key={categoryKey}
              className='border border-gray-200 rounded-xl overflow-hidden'
            >
              <div className='bg-gray-50 px-6 py-4 border-b border-gray-200'>
                <h3 className='text-lg font-semibold text-gray-900 capitalize'>
                  {categoryKey.replace(/([A-Z])/g, ' $1').trim()}
                </h3>
              </div>

              <div className='p-6 space-y-6'>
                {/* Summary */}
                <div>
                  <h4 className='font-medium text-gray-900 mb-2'>Summary</h4>
                  <p className='text-gray-700'>{category.summary}</p>
                </div>

                {/* Reasoning */}
                <div>
                  <h4 className='font-medium text-gray-900 mb-2'>Analysis</h4>
                  <p className='text-gray-700'>{category.reasoning}</p>
                </div>

                {/* Flagged Content */}
                {category.flaggedContent.length > 0 && (
                  <div>
                    <h4 className='font-medium text-gray-900 mb-3'>
                      Flagged Content
                    </h4>
                    <div className='space-y-3'>
                      {category.flaggedContent.map((flagged, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg border ${getSeverityColor(
                            flagged.severity
                          )}`}
                        >
                          <div className='flex items-start space-x-3'>
                            <div className='flex-shrink-0 mt-0.5'>
                              {getSeverityIcon(flagged.severity)}
                            </div>
                            <div className='flex-1'>
                              <p className='text-sm font-medium mb-1'>
                                {flagged.reason}
                              </p>
                              <blockquote className='text-sm italic border-l-2 border-current pl-3 mb-2'>
                                "{flagged.content}"
                              </blockquote>
                              <a
                                href={flagged.source.url}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='inline-flex items-center space-x-1 text-xs hover:underline'
                              >
                                <span>Source: {flagged.source.platform}</span>
                                <ExternalLink className='w-3 h-3' />
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sources */}
                {category.sources.length > 0 && (
                  <div>
                    <h4 className='font-medium text-gray-900 mb-3'>
                      Sources ({category.sources.length})
                    </h4>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                      {category.sources.slice(0, 6).map((source, index) => (
                        <a
                          key={index}
                          href={source.url}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group'
                        >
                          <div className='flex items-center justify-between'>
                            <div className='flex-1 min-w-0'>
                              <p className='text-sm font-medium text-gray-900 truncate'>
                                {source.platform}
                              </p>
                              <p className='text-xs text-gray-500 truncate'>
                                {source.type} •{' '}
                                {format(
                                  new Date(source.timestamp),
                                  'MMM dd, yyyy'
                                )}
                              </p>
                            </div>
                            <ExternalLink className='w-4 h-4 text-gray-400 group-hover:text-blue-600 flex-shrink-0 ml-2' />
                          </div>
                        </a>
                      ))}
                    </div>
                    {category.sources.length > 6 && (
                      <p className='text-sm text-gray-500 mt-2'>
                        +{category.sources.length - 6} more sources
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Metadata */}
        <div className='mt-8 pt-8 border-t border-gray-200'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <h4 className='font-medium text-gray-900 mb-3'>
                Data Sources Used
              </h4>
              <div className='flex flex-wrap gap-2'>
                {report.dataSourcesUsed.map((source, index) => (
                  <span
                    key={index}
                    className='px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full'
                  >
                    {source}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className='font-medium text-gray-900 mb-3'>Limitations</h4>
              <ul className='text-sm text-gray-600 space-y-1'>
                {report.limitations.map((limitation, index) => (
                  <li key={index} className='flex items-start space-x-2'>
                    <span className='text-gray-400 mt-1'>•</span>
                    <span>{limitation}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
