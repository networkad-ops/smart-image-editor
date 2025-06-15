import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageUpload } from './components/ImageUpload';
import { ImageEditor } from './components/ImageEditor';
import { Preview } from './components/Preview';
import { DeviceType, DeviceConfig, TextConfig } from './types';
import { deviceConfigs } from './config/deviceConfigs';

interface ImageEdit {
  id: string;
  version: number;
  deviceType: DeviceType;
  image: Blob;
  text: TextConfig;
  createdAt: Date;
  baseVersionId?: string;
}

function App() {
  const [step, setStep] = useState<'device' | 'image' | 'edit' | 'text' | 'preview'>('device');
  const [selectedDevice, setSelectedDevice] = useState<DeviceType | null>(null);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [editedImage, setEditedImage] = useState<Blob | null>(null);
  const [textConfig, setTextConfig] = useState<TextConfig>({
    title: '',
    subtitle: ''
  });
  const [edits, setEdits] = useState<ImageEdit[]>([]);

  const handleDeviceSelect = (device: DeviceType) => {
    setSelectedDevice(device);
    setStep('image');
  };

  const handleImageUpload = (file: File) => {
    setUploadedImage(file);
    setStep('edit');
  };

  const handleImageEdit = (blob: Blob) => {
    setEditedImage(blob);
    setStep('text');
  };

  const handleImageEditCancel = () => {
    setStep('image');
  };

  const handleTextChange = (newTextConfig: TextConfig) => {
    setTextConfig(newTextConfig);
    setStep('preview');
  };

  const handleDownload = () => {
    if (!editedImage) return;
    
    const url = URL.createObjectURL(editedImage);
    const a = document.createElement('a');
    a.href = url;
    a.download = `image-${selectedDevice}-${new Date().toISOString()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleComplete = () => {
    if (!selectedDevice || !editedImage) return;

    const newEdit: ImageEdit = {
      id: crypto.randomUUID(),
      version: 1,
      deviceType: selectedDevice,
      image: editedImage,
      text: textConfig,
      createdAt: new Date()
    };

    setEdits(prev => [...prev, newEdit]);
    setStep('device');
    resetState();
  };

  const handleBack = () => {
    switch (step) {
      case 'image':
        setStep('device');
        setSelectedDevice(null);
        break;
      case 'edit':
        setStep('image');
        setUploadedImage(null);
        break;
      case 'text':
        setStep('edit');
        setEditedImage(null);
        break;
      case 'preview':
        setStep('text');
        break;
      default:
        break;
    }
  };

  const resetState = () => {
    setSelectedDevice(null);
    setUploadedImage(null);
    setEditedImage(null);
    setTextConfig({ title: '', subtitle: '' });
  };

  const getDeviceConfig = (): DeviceConfig | null => {
    if (!selectedDevice) return null;
    return deviceConfigs[selectedDevice];
  };

  const deviceConfig = getDeviceConfig();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Smart Image Editor</h1>
          <p className="mt-2 text-gray-600">디바이스별 최적화된 이미지 에디터</p>
        </header>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center
                  ${step === 'device' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  1
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center
                  ${step === 'image' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  2
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center
                  ${step === 'edit' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  3
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center
                  ${step === 'text' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  4
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center
                  ${step === 'preview' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  5
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {step === 'device' && '디바이스 선택'}
                {step === 'image' && '이미지 업로드'}
                {step === 'edit' && '이미지 편집'}
                {step === 'text' && '텍스트 입력'}
                {step === 'preview' && '미리보기'}
              </div>
            </div>
            <div className="h-1 bg-gray-200 rounded-full">
              <div className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{
                  width: step === 'device' ? '20%' : 
                         step === 'image' ? '40%' : 
                         step === 'edit' ? '60%' : 
                         step === 'text' ? '80%' : '100%'
                }}
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 'device' && (
              <motion.div
                key="device"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <h2 className="text-2xl font-bold mb-4">디바이스 선택</h2>
                  <p className="text-gray-600 mb-8">사용할 디바이스 타입을 선택하세요</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(deviceConfigs).map(([key, config]) => (
                      <button
                        key={key}
                        onClick={() => handleDeviceSelect(key as DeviceType)}
                        className="p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:shadow-md transition-all duration-200 text-center"
                      >
                        <div className="text-lg font-semibold mb-2 capitalize">{key.replace('-', ' ')}</div>
                        <div className="text-sm text-gray-500">{config.width} × {config.height}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'image' && selectedDevice && deviceConfig && (
              <motion.div
                key="image"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="flex items-center justify-between w-full mb-4">
                    <h2 className="text-2xl font-bold">이미지 업로드</h2>
                    <button
                      onClick={handleBack}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      뒤로
                    </button>
                  </div>
                  <p className="text-gray-600 mb-8">이미지를 업로드하여 시작하세요</p>
                  <ImageUpload
                    deviceType={selectedDevice}
                    deviceConfig={deviceConfig}
                    onUpload={handleImageUpload}
                  />
                </div>
              </motion.div>
            )}

            {step === 'edit' && selectedDevice && deviceConfig && uploadedImage && (
              <motion.div
                key="edit"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="flex items-center justify-between w-full mb-4">
                  <h2 className="text-2xl font-bold">이미지 편집</h2>
                  <button
                    onClick={handleBack}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    뒤로
                  </button>
                </div>
                <ImageEditor
                  image={uploadedImage}
                  deviceConfig={deviceConfig}
                  onComplete={handleImageEdit}
                  onCancel={handleImageEditCancel}
                />
              </motion.div>
            )}

            {step === 'text' && selectedDevice && deviceConfig && (
              <motion.div
                key="text"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="flex items-center justify-between w-full mb-4">
                  <h2 className="text-2xl font-bold">텍스트 입력</h2>
                  <button
                    onClick={handleBack}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    뒤로
                  </button>
                </div>
                <div className="max-w-md mx-auto">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        제목
                      </label>
                      <input
                        type="text"
                        value={textConfig.title}
                        onChange={(e) => setTextConfig(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="제목을 입력하세요"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        부제목
                      </label>
                      <input
                        type="text"
                        value={textConfig.subtitle}
                        onChange={(e) => setTextConfig(prev => ({ ...prev, subtitle: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="부제목을 입력하세요"
                      />
                    </div>
                    <div className="flex space-x-3 pt-4">
                      <button
                        onClick={() => handleTextChange(textConfig)}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        다음
                      </button>
                      <button
                        onClick={() => handleTextChange({ title: '', subtitle: '' })}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        건너뛰기
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'preview' && selectedDevice && deviceConfig && editedImage && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="flex items-center justify-between w-full mb-4">
                    <h2 className="text-2xl font-bold">이미지 미리보기</h2>
                    <button
                      onClick={handleBack}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      뒤로
                    </button>
                  </div>
                  <Preview
                    image={editedImage}
                    text={textConfig}
                    deviceType={selectedDevice}
                    deviceConfig={deviceConfig}
                    onDownload={handleDownload}
                    onComplete={handleComplete}
                    onBack={handleBack}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {edits.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">작업 목록</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {edits.map((edit) => (
                <div key={edit.id} className="bg-white rounded-lg shadow-sm p-4">
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4">
                    <img
                      src={URL.createObjectURL(edit.image)}
                      alt={`Edit ${edit.version}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-500">
                      버전: {edit.version}
                    </div>
                    <div className="text-sm text-gray-500">
                      디바이스: {edit.deviceType}
                    </div>
                    <div className="text-sm text-gray-500">
                      생성일: {edit.createdAt.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;