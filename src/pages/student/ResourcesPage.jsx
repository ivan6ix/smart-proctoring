import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import StudentTopbarLayout from "../../layouts/StudentTopbarLayout";
import {
  Folder,
} from "lucide-react";

function ResourcesPage() {
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [courses, setCourses] = useState([]);
  const [folderName, setFolderName] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [fileToShare, setFileToShare] = useState(null);
  const [targetFolderId, setTargetFolderId] = useState("");
  const [previewFile, setPreviewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");


  const fetchCourses = async () => {
    const { data: userData } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("course_students")
      .select("courses(*)")
      .eq("student_id", userData.user.id);

    if (!error) {
      setCourses(data.map((item) => item.courses));
    }
  };

  const fetchFolders = async () => {
    const { data: userData } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("resource_folders")
      .select("*")
      .eq("student_id", userData.user.id)
      .order("created_at", { ascending: false });

    if (!error) {
      setFolders(data || []);
    }
  };

  const fetchFiles = async (folderId) => {
    const { data, error } = await supabase
      .from("resource_files")
      .select("*")
      .eq("folder_id", folderId)
      .order("created_at", { ascending: false });

    if (!error) {
      setFiles(data || []);
    }
  };

  const createFolder = async (e) => {
    e.preventDefault();

    if (!folderName.trim()) return;

    const { data: userData } = await supabase.auth.getUser();

    const { error } = await supabase.from("resource_folders").insert({
      student_id: userData.user.id,
      course_id: selectedCourse || null,
      folder_name: folderName,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setFolderName("");
    setSelectedCourse("");
    fetchFolders();
  };

  const uploadFile = async (e) => {
    const file = e.target.files[0];

    if (!file || !selectedFolder) return;

    setUploading(true);

    const { data: userData } = await supabase.auth.getUser();

    const filePath = `${userData.user.id}/${selectedFolder.id}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("student-resources")
      .upload(filePath, file);

    if (uploadError) {
      alert(uploadError.message);
      setUploading(false);
      return;
    }

    const { error: dbError } = await supabase.from("resource_files").insert({
      folder_id: selectedFolder.id,
      student_id: userData.user.id,
      course_id: selectedFolder.course_id || null,
      file_name: file.name,
      file_path: filePath,
      file_type: file.type,
      file_size: file.size,
    });

    if (dbError) {
      alert(dbError.message);
      setUploading(false);
      return;
    }

    setUploading(false);
    fetchFiles(selectedFolder.id);
  };

  const openFolder = (folder) => {
    setSelectedFolder(folder);
    fetchFiles(folder.id);
  };
    const submitFileToCourse = async (file) => {
    if (!file.course_id) {
    alert("This folder is not connected to a course.");
    return;
    }

    const { data: userData } = await supabase.auth.getUser();

    const { error } = await supabase.from("resource_submissions").insert({
    student_id: userData.user.id,
    course_id: file.course_id,
    folder_id: file.folder_id,
    file_id: file.id,
    status: "submitted",
    });

    if (error) {
    alert(error.message);
    return;
    }

    alert("File submitted to course successfully.");
    };
    const shareFileToFolder = async (e) => {
  e.preventDefault();

  if (!fileToShare || !targetFolderId) return;

  const targetFolder = folders.find((folder) => folder.id === targetFolderId);

  const { error } = await supabase.from("resource_files").insert({
    folder_id: targetFolder.id,
    student_id: fileToShare.student_id,
    course_id: targetFolder.course_id || null,
    file_name: fileToShare.file_name,
    file_path: fileToShare.file_path,
    file_type: fileToShare.file_type,
    file_size: fileToShare.file_size,
    });

    if (error) {
    alert(error.message);
    return;
    }

    alert("File shared to folder successfully.");
    setShowShareModal(false);
    setFileToShare(null);
    setTargetFolderId("");

    if (selectedFolder) {
    fetchFiles(selectedFolder.id);
        }
    };
    const openPreview = async (file) => {
    const { data, error } = await supabase.storage
    .from("student-resources")
    .createSignedUrl(file.file_path, 60);

    if (error) {
    alert(error.message);
    return;
    }

    setPreviewFile(file);
    setPreviewUrl(data.signedUrl);
};
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCourses();
    fetchFolders();
  }, []);

  return (
    <StudentTopbarLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Resources</h2>
          <p className="text-gray-500">
            Create folders, upload files, and manage your course resources.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="bg-white rounded-3xl shadow p-6 border border-gray-100">
          <h3 className="text-xl font-bold mb-4">Create Folder</h3>

          <form onSubmit={createFolder} className="space-y-4">
            <input
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="w-full border rounded-2xl px-4 py-3"
              placeholder="Folder name"
              required
            />

            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full border rounded-2xl px-4 py-3"
            >
              <option value="">Personal folder</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.course_name} - {course.section}
                </option>
              ))}
            </select>

            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-semibold">
              Create Folder
            </button>
          </form>
        </section>

        <section className="lg:col-span-2 bg-white rounded-3xl shadow p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xl font-bold">My Folders</h3>
            <span className="text-sm text-gray-500">
              {folders.length} folders
            </span>
          </div>

          {folders.length === 0 ? (
            <div className="border border-dashed rounded-3xl p-10 text-center text-gray-500">
              No folders created yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {folders.map((folder) => {
                const course = courses.find((c) => c.id === folder.course_id);

                return (
                  <button
                    key={folder.id}
                    onClick={() => openFolder(folder)}
                    className="text-left bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-200 rounded-3xl p-5 transition"
                  >
                    <Folder className="w-12 h-12 text-blue-600 mb-3" />
                    <h4 className="font-bold text-lg">{folder.folder_name}</h4>
                    <p className="text-gray-500 text-sm">
                      {course
                        ? `${course.course_name} - ${course.section}`
                        : "Personal folder"}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {selectedFolder && (
        <section className="mt-6 bg-white rounded-3xl shadow p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-xl font-bold">
                {selectedFolder.folder_name}
              </h3>
              <p className="text-gray-500">
                Upload and manage files inside this folder.
              </p>
            </div>

            <label className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-semibold cursor-pointer">
              {uploading ? "Uploading..." : "Upload File"}
              <input
                type="file"
                onChange={uploadFile}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>

          {files.length === 0 ? (
            <div className="border border-dashed rounded-3xl p-8 text-center text-gray-500">
              No files uploaded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between bg-gray-50 rounded-2xl p-4"
                >
                  <div>
                    <p className="font-bold">{file.file_name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.file_size / 1024).toFixed(1)} KB
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
  <button
    onClick={() => openPreview(file)}
    className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-2xl font-semibold"
  >
    Preview
  </button>

  <button
    onClick={() => submitFileToCourse(file)}
    className="bg-gray-900 text-white px-4 py-2 rounded-2xl font-semibold"
  >
    Submit to Course
  </button>

  <button
    onClick={() => {
      setFileToShare(file);
      setShowShareModal(true);
    }}
    className="bg-blue-600 text-white px-4 py-2 rounded-2xl font-semibold"
  >
    Share to Folder
  </button>
</div>
                
                </div>
              ))}
            </div>
          )}
        </section>
      )}
      {showShareModal && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
    <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-7">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xl font-bold">Share to Folder</h3>

        <button
          onClick={() => setShowShareModal(false)}
          className="text-gray-500 text-xl"
        >
          ✕
        </button>
      </div>

      <form onSubmit={shareFileToFolder} className="space-y-4">
        <select
          value={targetFolderId}
          onChange={(e) => setTargetFolderId(e.target.value)}
          className="w-full border rounded-2xl px-4 py-3"
          required
        >
          <option value="">Select target folder</option>

          {folders
            .filter((folder) => folder.id !== selectedFolder?.id)
            .map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.folder_name}
              </option>
            ))}
        </select>
            
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-semibold">
          Share File
        </button>
        
      </form>
    </div>
  </div>
)}
{previewFile && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
    <div className="bg-white rounded-3xl shadow-xl w-full max-w-5xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-xl font-bold">
            {previewFile.file_name}
          </h3>

          <p className="text-gray-500 text-sm">
            {previewFile.file_type}
          </p>
        </div>

        <button
          onClick={() => {
            setPreviewFile(null);
            setPreviewUrl("");
          }}
          className="text-gray-500 text-2xl"
        >
          ✕
        </button>
      </div>

      {previewFile.file_type?.startsWith("image/") ? (
        <img
          src={previewUrl}
          alt={previewFile.file_name}
          className="w-full max-h-[75vh] object-contain rounded-2xl bg-gray-100"
        />
      ) : previewFile.file_type === "application/pdf" ? (
        <iframe
          src={previewUrl}
          title={previewFile.file_name}
          className="w-full h-[75vh] rounded-2xl border"
        />
      ) : (
        <div className="border border-dashed rounded-3xl p-10 text-center">
          <p className="text-gray-500 mb-4">
            Preview is not available for this file type.
          </p>

          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-semibold"
          >
            Open File
          </a>
        </div>
      )}
    </div>
  </div>
)}
    </StudentTopbarLayout>
  );
}

export default ResourcesPage;