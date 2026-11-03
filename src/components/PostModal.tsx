import React, { useState, useRef, useEffect, useContext } from 'react';
import axios from 'axios';
import { UserDataContext } from '../context/userContext';
import type { PostData } from '../pages/UserDashboard';
import type { AlertData } from './Alert';
import { HiOutlinePhotograph, HiX } from 'react-icons/hi';
import { BsGlobe, BsLock } from 'react-icons/bs';
import api from '../lib/axiosInstance';

// Shared type-scale helper for the display face used on names/titles.
const serif = { fontFamily: "'Fraunces', 'Iowan Old Style', Georgia, serif" };

const MAX_FILES = 10;

const PostModal = ({
  setAlert,
  onClose,
  setPosts,
}: {
  setAlert: React.Dispatch<React.SetStateAction<AlertData | null>>;
  onClose: () => void;
  setPosts: React.Dispatch<React.SetStateAction<PostData[]>>;
}) => {
  const [content, setContent] = useState<string>('');
  const [visibility, setVisibility] = useState<string>('all');
  const [files, setFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const context = useContext(UserDataContext);
  const [previews, setPreviews] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  if (!context) return null;
  const { user } = context;

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index));
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleUpload = async () => {
    try {
      if (!content.trim() && files.length === 0) {
        setAlert({ type: 'error', title: 'Empty Post', message: 'Post must have content or media' });
        return;
      }
      setPosting(true);
      const formData = new FormData();
      files.forEach((file) => formData.append('file', file));
      formData.append('userId', String(user.id));
      formData.append('content', content);
      formData.append('visibility', visibility);
      const res = await api.post(
        `/upload-file`,
        formData
      );
      setPosts((prevPosts) => [...prevPosts, res.data.data]);
      setAlert({ type: 'success', title: 'Posted!', message: res.data.message });
      setFiles([]);
      setContent('');
      if (fileRef.current) fileRef.current.value = '';
      onClose();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data;
        if (data?.message) {
          setAlert({ type: 'error', title: 'Error', message: data.message });
          console.error('Error:', data.message);
        }
      } else {
        setAlert({ type: 'error', title: 'Error', message: 'Error uploading files' });
      }
    } finally {
      setPosting(false);
    }
  };

  const initials = user?.user_name ? user.user_name.slice(0, 2).toUpperCase() : 'U';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#26241F]/30 backdrop-blur-[2px] p-4">
      <div className="w-full max-w-[520px] max-h-[90vh] overflow-auto rounded-[18px] bg-white shadow-[0_12px_40px_rgba(38,36,32,0.16)] border border-[#E7E3DA]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EFECE4]">
          <h2 style={serif} className="text-[17px] font-medium text-[#26241F]">Create Post</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-[#B2AC9C] hover:bg-[#F1EFE9] hover:text-[#6B675C] transition-colors"
          >
            <HiX size={17} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* User row */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#F1EFE9] flex items-center justify-center flex-shrink-0">
              <span className="text-[#6B675C] text-xs font-semibold">{initials}</span>
            </div>
            <div>
              <p style={serif} className="text-[14.5px] font-medium text-[#26241F]">{user?.user_name}</p>
              {/* Visibility toggle */}
              <button
                onClick={() => setVisibility(v => v === 'all' ? 'onlyme' : 'all')}
                className="flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-md bg-[#F1EFE9] hover:bg-[#E7E3DA] transition-colors text-[11px] tracking-wide uppercase text-[#6B675C] font-medium"
              >
                {visibility === 'all' ? (
                  <><BsGlobe size={9} /> Public</>
                ) : (
                  <><BsLock size={9} /> Only me</>
                )}
              </button>
            </div>
          </div>

          {/* Text area */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            name="content"
            placeholder={`What's on your mind, ${user?.user_name?.split(' ')[0] || 'you'}?`}
            className="w-full min-h-[120px] resize-none bg-transparent text-[#2A2822] text-[14.5px] leading-relaxed placeholder:text-[#C4BFB0] outline-none border-none focus:ring-0 p-0"
          />

          {/* Media previews */}
          {previews.length > 0 && (
            <div
              className={`grid gap-2 ${
                previews.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
              }`}
            >
              {previews.map((preview, index) => (
                <div
                  key={preview}
                  className="relative overflow-hidden rounded-xl border border-[#E7E3DA]"
                >
                  {files[index]?.type.startsWith('video/') ? (
                    <video
                      src={preview}
                      muted
                      playsInline
                      preload="metadata"
                      className={`w-full object-cover ${
                        previews.length === 1 ? 'max-h-56' : 'h-32'
                      }`}
                    />
                  ) : (
                    <img
                      src={preview}
                      alt="preview"
                      className={`w-full object-cover ${
                        previews.length === 1 ? 'max-h-56' : 'h-32'
                      }`}
                    />
                  )}
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#26241F]/60 text-white transition-colors hover:bg-[#26241F]/80"
                  >
                    <HiX size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-[#EFECE4]" />

          {/* Bottom actions */}
          <div className="flex items-center justify-between">
            <label
              htmlFor="file-upload"
              className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer text-[#8A8578] hover:bg-[#F7F6F2] hover:text-[#435B52] transition-colors text-[13px] font-medium"
            >
              <HiOutlinePhotograph size={17} />
              <span>
                Photos{files.length > 0 ? ` (${files.length})` : ''}
              </span>
            </label>
            <input
              ref={fileRef}
              id="file-upload"
              type="file"
              hidden
              multiple
              accept="image/*,video/*"
              onChange={(e) => {
                const selected = Array.from(e.target.files ?? []);
                if (selected.length > MAX_FILES) {
                  setAlert({
                    type: 'error',
                    title: 'Too many files',
                    message: `You can upload up to ${MAX_FILES} photos or videos at once`,
                  });
                }
                setFiles(selected.slice(0, MAX_FILES));
                if (fileRef.current) fileRef.current.value = '';
              }}
            />

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-[13px] font-medium text-[#9C978A] hover:bg-[#F1EFE9] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={posting || (!content.trim() && files.length === 0)}
                className="px-5 py-2 rounded-xl bg-[#26241F] hover:bg-[#3A3833] disabled:opacity-40 disabled:cursor-not-allowed text-white text-[13px] font-medium transition-colors duration-150"
              >
                {posting ? 'Posting…' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostModal;