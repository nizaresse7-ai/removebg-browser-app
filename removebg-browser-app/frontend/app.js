const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const removeBtn = document.getElementById('removeBtn');
const resetBtn = document.getElementById('resetBtn');
const downloadBtn = document.getElementById('downloadBtn');
const statusBox = document.getElementById('status');
const originalPreview = document.getElementById('originalPreview');
const resultPreview = document.getElementById('resultPreview');
const originalPlaceholder = document.getElementById('originalPlaceholder');
const resultPlaceholder = document.getElementById('resultPlaceholder');
const backendUrlInput = document.getElementById('backendUrl');

let selectedFile = null;
let resultObjectUrl = null;

function setStatus(message, type = 'info') {
  statusBox.textContent = message;
  statusBox.className = `status ${type}`;
}

function setPreview(imgEl, placeholderEl, fileOrUrl) {
  if (!fileOrUrl) {
    imgEl.removeAttribute('src');
    imgEl.parentElement.classList.remove('has-image');
    placeholderEl.style.display = 'block';
    return;
  }

  imgEl.src = typeof fileOrUrl === 'string' ? fileOrUrl : URL.createObjectURL(fileOrUrl);
  imgEl.parentElement.classList.add('has-image');
  placeholderEl.style.display = 'none';
}

function clearResult() {
  if (resultObjectUrl) {
    URL.revokeObjectURL(resultObjectUrl);
    resultObjectUrl = null;
  }
  setPreview(resultPreview, resultPlaceholder, null);
  downloadBtn.classList.add('disabled');
  downloadBtn.removeAttribute('href');
}

fileInput.addEventListener('change', () => {
  const [file] = fileInput.files || [];
  if (!file) return;
  selectedFile = file;
  clearResult();
  setPreview(originalPreview, originalPlaceholder, file);
  setStatus(`Image loaded: ${file.name}`, 'info');
});

dropZone.addEventListener('click', () => fileInput.click());
['dragenter', 'dragover'].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.add('dragover');
  });
});
['dragleave', 'drop'].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.remove('dragover');
  });
});
dropZone.addEventListener('drop', (event) => {
  const [file] = event.dataTransfer.files || [];
  if (!file) return;
  selectedFile = file;
  fileInput.files = event.dataTransfer.files;
  clearResult();
  setPreview(originalPreview, originalPlaceholder, file);
  setStatus(`Image loaded: ${file.name}`, 'info');
});

resetBtn.addEventListener('click', () => {
  selectedFile = null;
  fileInput.value = '';
  setPreview(originalPreview, originalPlaceholder, null);
  clearResult();
  setStatus('Waiting for image...', 'info');
});

removeBtn.addEventListener('click', async () => {
  if (!selectedFile) {
    setStatus('Please upload an image first.', 'error');
    return;
  }

  setStatus('Removing background... please wait.', 'info');
  clearResult();

  const formData = new FormData();
  formData.append('file', selectedFile);
  formData.append('model', document.getElementById('model').value);
  formData.append('alpha_matting', String(document.getElementById('alphaMatting').checked));
  formData.append('alpha_matting_foreground_threshold', document.getElementById('foreground').value || '240');
  formData.append('alpha_matting_background_threshold', document.getElementById('background').value || '10');
  formData.append('alpha_matting_erode_size', document.getElementById('erode').value || '10');

  try {
    const response = await fetch(backendUrlInput.value.trim() || '/api/remove', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `HTTP ${response.status}`);
    }

    const blob = await response.blob();
    resultObjectUrl = URL.createObjectURL(blob);
    setPreview(resultPreview, resultPlaceholder, resultObjectUrl);
    downloadBtn.href = resultObjectUrl;
    downloadBtn.classList.remove('disabled');
    setStatus('Background removed successfully. You can now download the PNG.', 'success');
  } catch (error) {
    setStatus(`Failed: ${error.message}`, 'error');
  }
});

setStatus('Waiting for image...', 'info');
