import React, { useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Cropper from "react-easy-crop";
import { FaCamera } from "react-icons/fa";
import { toast } from "react-toastify";
import Card from "../components/Card";

const getCroppedImg = (imageSrc: string, pixelCrop: any): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(
          image,
          pixelCrop.x,
          pixelCrop.y,
          pixelCrop.width,
          pixelCrop.height,
          0,
          0,
          pixelCrop.width,
          pixelCrop.height
        );
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas is empty"));
        }, "image/png");
      } else {
        reject(new Error("Canvas context not found"));
      }
    };
    image.onerror = (error) => reject(error);
  });
};

const EditProfile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.username || "");
  const [profilePic, setProfilePic] = useState<string>(user?.profilePicture || "");
  const [email] = useState(user?.email || "");
  const [loading, setLoading] = useState(false);

  // Cropper states
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  // Camera states
  const [showCameraDropdown, setShowCameraDropdown] = useState(false);
  const [showCameraInterface, setShowCameraInterface] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [usernameError, setUsernameError] = useState<string | null>(null); 

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);

    // Validation: no spaces, no uppercase
    if (/[A-Z]/.test(value)) {
      setUsernameError('Username cannot contain uppercase letters.');
    } else if (/\s/.test(value)) {
      setUsernameError('Use underscores ( _ ) instead of spaces.');
    } else if (value.length === 0) {
      setUsernameError('Username is required.');
    } else {
      setUsernameError(null);
    }
  };

  // Handle crop complete
  const onCropComplete = (_: any, croppedPixels: any) => {
    setCroppedAreaPixels(croppedPixels);
  };

  // Save cropped image
  const handleCropSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const croppedUrl = URL.createObjectURL(croppedBlob);
      setProfilePic(croppedUrl);
      setShowCropper(false);
      setImageSrc(null);
    } catch {
      toast.error("Failed to crop image");
    }
  };

  // Upload image to Cloudinary
  const uploadToCloudinary = async (file: Blob) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    return data.secure_url;
  };

  // Save handler
  const handleSave = async () => {
    if (usernameError) {
      toast.error(usernameError);
      return;
    }
    setLoading(true);
    try {
      let profilePictureUrl = profilePic;
      // If profilePic is a blob url, upload to Cloudinary
      if (profilePic.startsWith("blob:")) {
        const blob = await fetch(profilePic).then((r) => r.blob());
        profilePictureUrl = await uploadToCloudinary(blob);
      }
      // Update user in backend
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/auth/updatedetails`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username: name, profilePicture: profilePictureUrl }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        updateUser(data.user);
        toast.success("Profile updated!");
        navigate("/profile");
      } else {
        throw new Error(data.error || "Failed to update profile");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  // Camera logic
  const handleCaptureOption = async () => {
    setShowCameraDropdown(false);
    setShowCameraInterface(true);
    setCapturedImage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      toast.error("Error accessing camera");
    }
  };

  const handleUploadOption = () => {
    setShowCameraDropdown(false);
    fileInputRef.current?.click();
  };

  const handleCaptureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/png");
        setCapturedImage(dataUrl);
        setShowCameraInterface(false);
        setShowCropper(true);
        // Stop video stream
        let stream = video.srcObject as MediaStream;
        if (stream) stream.getTracks().forEach((track) => track.stop());
      }
    }
  };

  // When cropping after capture
  React.useEffect(() => {
    if (capturedImage) {
      setImageSrc(capturedImage);
    }
  }, [capturedImage]);

  return (
    <div className="w-full pb-8">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Edit Profile</h1>
      <Card title="">
        <div className="flex flex-col items-center space-y-6">
          <div className="relative group over">
            <img
              src={
                profilePic ||
                "https://res.cloudinary.com/dvb5mesnd/image/upload/v1741339315/Screenshot_2025-03-07_145028-removebg-preview_mqw8by.png"
              }
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover border-4 border-indigo-100 dark:border-indigo-900 shadow-sm"
            />
            <div className="absolute bottom-0 left-0 right-0 overflow-hidden w-32 h-32 rounded-full cursor-pointer">
                <div
                className="absolute bottom-0 left-0 right-0 h-10 bg-black bg-opacity-50 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={(e) => {
                    e.stopPropagation();
                    setShowCameraDropdown((prev) => !prev);
                }}
                >
                <FaCamera size={20} className="text-white" />
                </div>
            </div>
            {showCameraDropdown && (
              <div className="absolute bottom-0 -right-20 bg-transparent rounded shadow p-2 z-10">
                <button
                  onClick={handleCaptureOption}
                  className="block w-full text-left p-2 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  Capture
                </button>
                <button
                  onClick={handleUploadOption}
                  className="block w-full text-left p-2 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  Upload
                </button>
              </div>
            )}
          </div>
          <input
            title="Upload Profile Picture"
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="w-full max-w-md">
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={handleNameChange} // <-- Use validation handler
                className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                required
                placeholder="Enter your username"
              />
              {usernameError && (
                <div className="text-red-500 text-sm mt-1">{usernameError}</div>
              )}
            </div>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email (You cannot change your email)
              </label>
              <input
                id="email"
                type="email"
                value={email}
                readOnly
                className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors cursor-not-allowed"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => navigate("/profile")}
                className="px-4 py-2 rounded-lg bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-400 dark:hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${loading
                  ? "bg-purple-400 cursor-not-allowed"
                  : "bg-purple-600 hover:bg-purple-700"
                  }`}
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      </Card>
      {/* Camera Interface Modal */}
      {showCameraInterface && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow-lg">
            <video ref={videoRef} className="w-80 h-60 bg-black" autoPlay />
            <div className="flex justify-between mt-4">
              <button
                onClick={handleCaptureFrame}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              >
                Capture
              </button>
              <button
                onClick={() => {
                  if (videoRef.current && videoRef.current.srcObject) {
                    let stream = videoRef.current.srcObject as MediaStream;
                    stream.getTracks().forEach((track) => track.stop());
                  }
                  setShowCameraInterface(false);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
              >
                Cancel
              </button>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
      )}
      {/* Cropper Modal */}
      {showCropper && imageSrc && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg">
            <h2 className="mb-4 text-xl font-bold text-gray-700 dark:text-white">Crop your image</h2>
            <div className="relative w-80 h-60 bg-black">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="flex justify-between mt-4">
              <button
                onClick={handleCropSave}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowCropper(false);
                  setImageSrc(null);
                  setCapturedImage(null);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditProfile;