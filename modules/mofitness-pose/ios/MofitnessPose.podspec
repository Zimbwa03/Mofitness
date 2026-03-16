Pod::Spec.new do |s|
  s.name           = 'MofitnessPose'
  s.version        = '1.0.0'
  s.summary        = 'Native MediaPipe pose stream view for the Mofitness form checker'
  s.description    = 'Provides a local Expo module surface for production-grade live pose tracking.'
  s.author         = 'Codex'
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = {
    :ios => '15.1'
  }
  s.source         = { git: 'https://example.com/mofitness' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.dependency 'MediaPipeTasksVision'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
  s.resources = ['ios/Resources/*.task']
end
