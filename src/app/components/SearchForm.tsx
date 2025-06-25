/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useDropzone } from 'react-dropzone'
import {
  Search,
  Upload,
  User,
  Github,
  Linkedin,
  MessageCircle,
  Youtube,
  Instagram,
  Twitter,
} from 'lucide-react'
import { TargetPerson } from '../types'

interface SearchFormProps {
  onSubmit: (data: TargetPerson) => void
  isLoading?: boolean
}

export const SearchForm: React.FC<SearchFormProps> = ({
  onSubmit,
  isLoading,
}) => {
  const [uploadedPhoto, setUploadedPhoto] = useState<File | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<TargetPerson>()

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0]
      setUploadedPhoto(file)
      setValue('photo', file)
    },
  })

  const handleFormSubmit = (data: TargetPerson) => {
    onSubmit({
      ...data,
      photo: uploadedPhoto || undefined,
    })
  }

  return (
    <div className='max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8'>
      <div className='text-center mb-8'>
        <div className='inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4'>
          <Search className='w-8 h-8 text-blue-600' />
        </div>
        <h1 className='text-3xl font-bold text-gray-900 mb-2'>
          AI Reputation Lookup
        </h1>
        <p className='text-gray-600'>
          Generate comprehensive reputation reports using AI-powered analysis
        </p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className='space-y-6'>
        {/* Basic Information */}
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold text-gray-900 flex items-center'>
            <User className='w-5 h-5 mr-2' />
            Basic Information
          </h3>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Full Name *
            </label>
            <input
              {...register('name', { required: 'Name is required' })}
              type='text'
              className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'
              placeholder="Enter the person's full name"
            />
            {errors.name && (
              <p className='mt-1 text-sm text-red-600'>{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Email (Optional)
            </label>
            <input
              {...register('email')}
              type='email'
              className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'
              placeholder='person@example.com'
            />
          </div>
        </div>

        {/* Photo Upload */}
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold text-gray-900 flex items-center'>
            <Upload className='w-5 h-5 mr-2' />
            Photo Upload (Optional)
          </h3>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            {uploadedPhoto ? (
              <div className='space-y-2'>
                <div className='w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center'>
                  <Upload className='w-8 h-8 text-green-600' />
                </div>
                <p className='text-sm font-medium text-gray-900'>
                  {uploadedPhoto.name}
                </p>
                <p className='text-xs text-gray-500'>Click to change photo</p>
              </div>
            ) : (
              <div className='space-y-2'>
                <div className='w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center'>
                  <Upload className='w-8 h-8 text-gray-400' />
                </div>
                <p className='text-sm text-gray-600'>
                  {isDragActive
                    ? 'Drop the photo here'
                    : 'Drag & drop a photo, or click to select'}
                </p>
                <p className='text-xs text-gray-500'>
                  PNG, JPG, WEBP up to 10MB
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Social Handles */}
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold text-gray-900'>
            Social Media Handles (Optional)
          </h3>
          <p className='text-sm text-gray-600'>
            Providing social handles improves search accuracy and data coverage
          </p>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                <Linkedin className='w-4 h-4 inline mr-1' />
                LinkedIn
              </label>
              <input
                {...register('socialHandles.linkedin')}
                type='text'
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'
                placeholder='linkedin.com/in/username'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                <Twitter className='w-4 h-4 inline mr-1' />
                Twitter/X
              </label>
              <input
                {...register('socialHandles.twitter')}
                type='text'
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'
                placeholder='@username'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                <MessageCircle className='w-4 h-4 inline mr-1' />
                Reddit
              </label>
              <input
                {...register('socialHandles.reddit')}
                type='text'
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'
                placeholder='u/username'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                <Youtube className='w-4 h-4 inline mr-1' />
                YouTube
              </label>
              <input
                {...register('socialHandles.youtube')}
                type='text'
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'
                placeholder='@channelname'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                <Github className='w-4 h-4 inline mr-1' />
                GitHub
              </label>
              <input
                {...register('socialHandles.github')}
                type='text'
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'
                placeholder='username'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                <Instagram className='w-4 h-4 inline mr-1' />
                Instagram
              </label>
              <input
                {...register('socialHandles.instagram')}
                type='text'
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'
                placeholder='@username'
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type='submit'
          disabled={isLoading}
          className='w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2'
        >
          {isLoading ? (
            <>
              <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white'></div>
              <span>Generating Report...</span>
            </>
          ) : (
            <>
              <Search className='w-5 h-5' />
              <span>Generate Reputation Report</span>
            </>
          )}
        </button>
      </form>
    </div>
  )
}
