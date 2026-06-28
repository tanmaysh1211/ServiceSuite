import React from "react"

interface ProfileCompletenessMeterProps {
  completeness: number // Value between 0 and 100
}

const ProfileCompletenessMeter: React.FC<ProfileCompletenessMeterProps> = ({ completeness }) => {
  return (
    <div className="w-full max-w-md mx-auto my-4 p-4 bg-white dark:bg-gray-800 rounded shadow">
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold">Profile Completeness</span>
        <span className="text-sm text-gray-600 dark:text-gray-300">{completeness}%</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
        <div
          className="bg-green-500 h-3 rounded-full transition-all duration-300"
          style={{ width: `${completeness}%` }}
        />
      </div>
      {completeness < 100 && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Complete your profile to increase your chances of getting noticed!
        </p>
      )}
    </div>
  )
}

export default ProfileCompletenessMeter 