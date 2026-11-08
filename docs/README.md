# MatrVaani Documentation Hub

Welcome to the comprehensive technical documentation for **MatrVaani (मातृवाणी / ᱢᱟᱛᱨᱤᱵᱟᱬᱤ)** — an assistive vernacular pedagogy and speech synthesis suite designed for indigenous multilingual classrooms in Jharkhand, supporting the **PALASH (MTB-MLE)** and **NIPUN Bharat FLN** initiatives.

---

## 📚 Documentation Index

### 1. Architecture & System Design
- **[System Architecture & Multi-Lingual Flow](architecture/SYSTEM_ARCHITECTURE.md)**:
  Complete end-to-end blueprint covering Hindi ASR, NMT translation to Ho / Mundari / Santali, Unicode script rendering, and offline acoustic TTS vocoding. Includes latency budgets, memory profiling for 2GB RAM Android tablets, and pipeline flowcharts.

### 2. Vernacular Pedagogy & Classroom Scaling
- **[PALASH Pedagogy & Offline Scaling Blueprint](pedagogy/PALASH_AI_PEDAGOGY_SPEC.md)**:
  Detailed specification for Mother Tongue-Based Multilingual Education (MTB-MLE) in Jharkhand schools. Outlines the 4-stage modular ML pipeline (Sherpa-ONNX Hindi ASR $\rightarrow$ 4-bit IndicTrans2 NMT $\rightarrow$ INT8 Piper/VITS TTS $\rightarrow$ NIPUN Bharat layout engine).

### 3. Web UI & Prototype Specifications
- **[Interactive Web UI Prototype Specification](specifications/WEB_UI_SPEC.md)**:
  Front-end architectural specification, sequence diagrams for browser-to-Colab GPU bridging, audio buffer handling, FLN Activity Bank integration, and Ol Chiki virtual keyboard mechanics.

### 4. Model Training & Cloud Guides
- **[Santali TTS Pipeline Documentation](../santali_tts/README.md)**:
  Overview of the `ai4bharat/indic-parler-tts-pretrained` fine-tuning pipeline on the `ai4bharat/Rasa` Santali split.
- **[Google Colab Setup & Training Guide](../santali_tts/COLAB_SETUP_GUIDE.md)**:
  10-step Colab tutorial for dataset extraction, 1-epoch test fine-tuning, checkpoint saving to Google Drive, and interactive audio playback.
- **[Datasets & Audio Codec Resources](../santali_tts/RESOURCES.md)**:
  Detailed metadata, schema, and reference links for the AI4Bharat Rasa corpus and Descript Audio Codec (DAC).
