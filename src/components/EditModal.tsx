import React, { useState, useRef, useEffect, useContext } from 'react';
import { UserDataContext } from '../context/userContext';
import type { PostData } from '../pages/UserDashboard';
// import Alert from './Alert';
import axios from 'axios';
import type { AlertData } from './Alert';
import { HiX } from 'react-icons/hi';

interface Props {
  post: PostData;
  setPosts: React.Dispatch<React.SetStateAction<PostData[]>>;
  setAlert: React.Dispatch<React.SetStateAction<AlertData | null>>;
  onClose: () => void;
}

// Shared type-scale helper for the display face used on titles.
const serif = { fontFamily: "'Fraunces', 'Iowan Old Style', Georgia, serif" };

const EditModal = ({ post, setAlert, onClose, setPosts }: Props) => {
  const [content, setContent] = useState<string>('');
  const [visibility, setVisibility] = useState<string>('');
  const fileRef = useRef<HTMLInputElement | null>(null);
  const context = useContext(UserDataContext);

  useEffect(() => {
    setContent(post.content);
    setVisibility(post.visiblity);
  }, [post]);

  if (!context) return null;
  const { user } = context;

  const handleUpdatePost = async () => {
    try {
        const updateData={
            post_id:post.id,
            user_id:user.id,
            content,
            visibility,
        }
        console.log(updateData)
        const updatePost=await axios.patch(`${import.meta.env.VITE_BACKEND_API}/update-post`,updateData,{
            withCredentials:true
        })
        if(updatePost.status===200){
       setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, content, visiblity: visibility } : p))
      );
           setAlert({
        type: 'success',
        title: 'Post Updated',
        message: updatePost.data.message,
      });
      onClose();
        }
     
    } catch (err) {
        if(axios.isAxiosError(err)){
            const data = err.response?.data
            if(data?.message){
        setAlert({
          type:"error",
          title:"Error Updating Posts",
          message:data.message
        })
        console.error("Error Updating Post:",data.message)
            }
        }else{
        setAlert({
        type:"error",
        title:"Error Updating Posts",
        message:"Error Updating Posts"
    })
        }
     
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-[#26241F]/30 backdrop-blur-[2px] p-4'>
      <div className='w-full sm:w-[560px] max-h-[85vh] overflow-auto rounded-[18px] bg-white shadow-[0_12px_40px_rgba(38,36,32,0.16)] border border-[#E7E3DA]'>
        <div className='flex items-center justify-between px-6 py-4 border-b border-[#EFECE4]'>
          <div>
            <h2 style={serif} className='text-[17px] font-medium text-[#26241F]'>Edit Post</h2>
           
          </div>
          <button
            type='button'
            className='w-8 h-8 flex items-center justify-center rounded-full text-[#B2AC9C] hover:bg-[#F1EFE9] hover:text-[#6B675C] transition-colors'
            aria-label='Close modal'
            onClick={onClose}
          >
            <HiX size={17} />
          </button>
        </div>

        <div className='p-6 space-y-5'>
          <div>
            <label htmlFor='postText' className='sr-only'>Post text</label>
            <textarea
              onChange={(e) => {
                setContent(e.target.value);
              }}
              value={content}
              name='content'
              id='postText'
              className='min-h-[140px] w-full resize-none rounded-xl border border-[#E7E3DA] bg-[#F7F6F2] px-4 py-3 text-[14.5px] text-[#2A2822] outline-none transition-colors focus:border-[#435B52] focus:ring-2 focus:ring-[#E9EEEA] focus:bg-white placeholder:text-[#B2AC9C]'
              placeholder='What do you want to share today?'
            />
          </div>

          {post.media && post.media.length > 0 && (
            <div className='rounded-xl border border-[#E7E3DA] bg-white p-4'>
              <div className='mb-3'>
                <span className='text-[14px] font-medium text-[#3A3833]'>Media </span>
                <span className='text-[12px] text-[#9C978A] mt-0.5'>(Cannot edit media)</span>
              </div>
              <input ref={fileRef} id='file' className='hidden' type='file' hidden />

              <div className='flex gap-2 flex-wrap'>
                {post.media.map((m) => (
                  <img key={m.media_id} src={m.file_url} alt='post media' className='h-24 w-24 object-cover rounded-lg border border-[#E7E3DA]' />
                ))}
                
              </div>
               
            </div>
          )}

          <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1'>
            <div>
              <select
                name='visiblity'
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className='rounded-lg border border-[#E7E3DA] bg-[#F7F6F2] px-3 py-2 text-[13px] text-[#3A3833] outline-none focus:border-[#435B52] focus:ring-2 focus:ring-[#E9EEEA] transition-colors'
              >
                <option value='all'>Public</option>
                <option value='onlyme'>Only me</option>
              </select>
            </div>
            <div className='flex flex-wrap gap-2'>

              <button
                type='button'
                className='rounded-xl px-4 py-2 text-[13px] font-medium text-[#9C978A] hover:bg-[#F1EFE9] transition-colors'
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePost}
                type='button'
                className='rounded-xl bg-[#26241F] hover:bg-[#3A3833] px-5 py-2 text-[13px] font-medium text-white transition-colors duration-150'
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditModal;