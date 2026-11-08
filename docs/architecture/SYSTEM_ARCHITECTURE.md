# Offline AI Vernacular Pedagogy & Speech Translation Suite
## Complete Architecture & System Flowcharts (Hindi ➔ Ho / Mundari / Santali)

---

## 1. Master Architecture

```mermaid
flowchart TD
    subgraph Classroom ["Offline Classroom Environment (Android 9+ / 2GB RAM)"]
        Teacher([Teacher]) -->|Hindi Speech / Text| ASR[Offline Hindi ASR Engine]
        ASR -->|Hindi Devanagari Text| LangSelect{Target Language Selection}
        
        LangSelect -->|Ho Selection| HoPipeline[Ho Offline Pipeline]
        LangSelect -->|Mundari Selection| MunPipeline[Mundari Offline Pipeline]
        LangSelect -->|Santali Selection| SanPipeline[Santali Offline Pipeline]
        
        HoPipeline --> AudioOut[Tablet Speaker Output]
        MunPipeline --> AudioOut
        SanPipeline --> AudioOut
    end

    subgraph PedagogySuite ["Offline Vernacular Pedagogy & FLN Engine"]
        Curriculum[Hindi FLN / NIPUN Bharat Curriculum] --> PedagogyEngine[Educational Content Generator]
        LangSelect -.->|Target Language| PedagogyEngine
        PedagogyEngine --> Flashcards[Visual & Audio Flashcards]
        PedagogyEngine --> Worksheets[Bilingual Worksheets / Offline PDF]
        PedagogyEngine --> LessonGuides[Teacher Lesson Guides]
    end
```

---

## 2. Complete ML Pipeline

```mermaid
flowchart TD
    subgraph Stage1 ["Stage 1: Hindi ASR"]
        A1[Hindi Audio Input] --> A2[Audio Capture 16kHz Mono]
        A2 --> A3[Silero VAD Voice Activity Detector]
        A3 --> A4[Noise Filtering / Preprocessing]
        A4 --> A5[Sherpa-ONNX Hindi Conformer / Whisper ASR]
        A5 --> A6[Hindi Devanagari Text]
    end

    subgraph Stage2 ["Stage 2: Offline NMT"]
        A6 --> B1[Language Identification / Selection]
        B1 --> B2[Target Language Tokenizer]
        B2 --> B3[Offline NMT Model Inference]
        B3 --> B4[Target Tribal Language Text]
    end

    subgraph Stage3 ["Stage 3: Target Script Rendering"]
        B4 --> C1[Unicode Script Validator]
        C1 --> C2[Script Rendering Engine]
        C2 --> C3[Warang Citi / Mundari Bani / Ol Chiki Output]
    end

    subgraph Stage4 ["Stage 4: Offline Acoustic TTS"]
        C3 --> D1[Acoustic Feature Generator / VITS / FastSpeech2]
        D1 --> D2[Neural Vocoder / HiFi-GAN ONNX]
        D2 --> D3[PCM Audio Stream 22.05 / 44.1 kHz]
        D3 --> D4[Reusable Audio Buffer]
        D4 --> D5[Android AudioTrack / Speaker]
    end
```

---

## 3. Hindi ASR Pipeline

```mermaid
flowchart LR
    Mic([Teacher Voice]) --> Capture[16-bit PCM Audio Capture]
    Capture --> VAD[VAD Frame Slicing]
    VAD --> Denoiser[Spectral Subtraction / Pre-emphasis]
    Denoiser --> AcousticModel["Sherpa-ONNX Conformer ASR (INT8)"]
    AcousticModel --> CTCBeamSearch[Beam Search Decoder]
    CTCBeamSearch --> DevaText["Hindi Devanagari Output (U+0900–U+097F)"]
```

---

## 4. Ho Translation & Synthesis Pipeline

```mermaid
flowchart TD
    HindiText[Hindi Devanagari Text] --> HoAdapter[HindiToHoTranslator Adapter]
    
    subgraph HoNMT ["Ho NMT Engine"]
        HoAdapter --> HoStatus{Model Deployed?}
        HoStatus -- Yes --> HoNMTModel["Offline Ho NMT (Warang Citi / Devanagari)"]
        HoStatus -- No --> HoPending["[MODEL REQUIRED / NOT YET DEPLOYED]"]
    end
    
    HoNMTModel --> HoText[Ho Target Text]
    
    subgraph HoTTS ["Ho Acoustic Synthesis"]
        HoText --> HoTTSAdapter[HoTTS Engine]
        HoTTSAdapter --> HoAcoustic["Local Ho Acoustic Model + Vocoder"]
        HoAcoustic --> HoPCM[PCM Waveform]
    end
    
    HoPCM --> Speaker([Tablet Speaker])
```

---

## 5. Mundari Translation & Synthesis Pipeline

```mermaid
flowchart TD
    HindiText[Hindi Devanagari Text] --> MunAdapter[HindiToMundariTranslator Adapter]
    
    subgraph MunNMT ["Mundari NMT Engine"]
        MunAdapter --> MunStatus{Model Deployed?}
        MunStatus -- Yes --> MunNMTModel["Offline Mundari NMT (Mundari Bani / Devanagari)"]
        MunStatus -- No --> MunPending["[MODEL REQUIRED / NOT YET DEPLOYED]"]
    end
    
    MunNMTModel --> MunText[Mundari Target Text]
    
    subgraph MunTTS ["Mundari Acoustic Synthesis"]
        MunText --> MunTTSAdapter[MundariTTS Engine]
        MunTTSAdapter --> MunAcoustic["Local Mundari Acoustic Model + Vocoder"]
        MunAcoustic --> MunPCM[PCM Waveform]
    end
    
    MunPCM --> Speaker([Tablet Speaker])
```

---

## 6. Santali Translation & Synthesis Pipeline

```mermaid
flowchart TD
    HindiSpeech[Hindi Speech] --> OfflineASR[Offline Hindi ASR]
    OfflineASR --> DevaText["Hindi Devanagari (hin_Deva)"]
    
    subgraph SantaliNMT ["IndicTrans2 NMT Engine"]
        DevaText --> IndicTrans2["ai4bharat/indictrans2-indic-indic-dist-320M (hin_Deva ➔ sat_Olck)"]
        IndicTrans2 --> OlChikiText["Santali Ol Chiki Unicode (sat_Olck)"]
        OlChikiText --> ScriptVal[Ol Chiki Validator U+1C50–U+1C7F]
    end
    
    subgraph SantaliTTS ["Custom Santali Indic Parler-TTS"]
        ScriptVal --> CustomTTS["Fine-Tuned Santali Parler-TTS Model"]
        CustomTTS --> DAC[Descript Audio Codec / Vocoder]
        DAC --> WavAudio[44.1 kHz Studio Audio]
    end
    
    WavAudio --> Speaker([Tablet Speaker])
```

---

## 7. Translation Model Abstraction Architecture

```mermaid
flowchart TD
    subgraph Client ["Application Service Layer"]
        App[Translation Service] --> CommonInterface[TranslationEngine Interface]
    end

    subgraph Engine ["Translation Engine Architecture"]
        CommonInterface --> HoAdapter[HindiToHoTranslator Adapter]
        CommonInterface --> MunAdapter[HindiToMundariTranslator Adapter]
        CommonInterface --> SanAdapter[HindiToSantaliTranslator Adapter]
        
        HoAdapter --> RealHoModel["Local Ho Model / Status Checker"]
        MunAdapter --> RealMunModel["Local Mundari Model / Status Checker"]
        SanAdapter --> RealSanModel["IndicTrans2 ONNX INT8 Model"]
    end

    subgraph ProhibitedPolicy ["Strict Quality Policy"]
        NoDict[No Hardcoded Dictionaries]
        NoPhrase[No Phrasebooks]
        NoRegex[No Regex Replacement]
        NoFallback[No Fake Fallbacks]
    end
```

---

## 8. TTS Manager Abstraction Architecture

```mermaid
flowchart TD
    subgraph TTSClient ["TTS Client Layer"]
        TextIn[Target Tribal Text] --> TTSManager[TTSManager Interface]
    end

    subgraph SynthesisAdapters ["TTS Adapters Layer"]
        TTSManager --> HoTTS[HoTTS Adapter]
        TTSManager --> MunTTS[MundariTTS Adapter]
        TTSManager --> SanTTS[SantaliTTS Adapter]
        
        HoTTS --> HoWeights["Local Ho VITS/ONNX"]
        MunTTS --> MunWeights["Local Mundari VITS/ONNX"]
        SanTTS --> SanWeights["Custom Fine-Tuned Santali TTS"]
    end

    subgraph OutputPipeline ["Audio Dispatcher"]
        HoWeights --> AudioMixer[PCM Buffer Manager]
        MunWeights --> AudioMixer
        SanWeights --> AudioMixer
        AudioMixer --> AudioTrack[Android AudioTrack Dispatcher]
    end
```

---

## 9. Real-Time Voice-to-Voice Latency Flow

```mermaid
flowchart TD
    A([Teacher Taps Mic & Speaks]) --> B[Audio Capture & VAD]
    
    subgraph ASR_Stage ["1. Speech Recognition"]
        B --> C[Offline Hindi ASR]
        C --> D["Devanagari Text (Budget: ~350 ms)"]
    end
    
    subgraph NMT_Stage ["2. Neural Translation"]
        D --> E[Offline NMT Engine]
        E --> F["Target Tribal Text (Budget: ~400 ms)"]
    end
    
    subgraph TTS_Stage ["3. Acoustic Synthesis"]
        F --> G[Offline TTS Engine]
        G --> H["Audio Buffer (Budget: ~750 ms)"]
    end
    
    subgraph Audio_Stage ["4. Speaker Dispatch"]
        H --> I[Android AudioTrack Playback]
        I --> J["Speaker Sound (Budget: ~200 ms)"]
    end
    
    J --> K([Total Latency Display: ≤ 3000 ms])
```

---

## 10. FLN Curriculum Generation Pipeline

```mermaid
flowchart TD
    A[Hindi FLN Source Curriculum] --> B[Curriculum Content Parser]
    B --> C{Content Type Identification}
    
    C --> D[Lesson Script]
    C --> E[Activity Instructions]
    C --> F[Assessment Prompts]
    C --> G[Vocabulary & Phonics]
    
    D & E & F & G --> H[Learning Outcome Identification]
    H --> I[Offline Translation Engine]
    I --> J[Target Tribal Language Generation]
    J --> K[Curriculum Structuring Engine]
    
    K --> L[Teacher Lesson Guide]
    K --> M[Student Activity Worksheets]
    K --> N[Visual Learning Flashcard Sets]
```

---

## 11. NIPUN Bharat Pedagogical Alignment Flow

```mermaid
flowchart TD
    NIPUN[NIPUN Bharat / FLN Guidelines] --> Competency[Competency Definition]
    Competency --> LO[Measurable Learning Outcome]
    LO --> LessonObj[Lesson Objective]
    LessonObj --> Content[Hindi Source Curriculum Content]
    Content --> NMT[Offline ML Translation]
    NMT --> TargetLang[Target Tribal Language]
    TargetLang --> PedagogyAct[Mother-Tongue Classroom Activity]
    
    PedagogyAct --> Out1[Bilingual Worksheets]
    PedagogyAct --> Out2[Phonics / Vocab Flashcards]
    PedagogyAct --> Out3[Interactive Oral Dialogue]
```

---

## 12. Bilingual Worksheet Generation Pipeline

```mermaid
flowchart TD
    LO[Learning Outcome] --> Activity[Hindi Activity Content]
    Activity --> NMT[Offline NMT Translation]
    NMT --> TargetContent[Target Tribal Translation]
    
    TargetContent --> LayoutEngine[Worksheet Layout Engine]
    LayoutEngine --> Template[Bilingual Template Selection]
    
    subgraph SheetStructure ["Generated Worksheet Layout"]
        Template --> Header[Bilingual Header & Instructions]
        Template --> Graphic[Pedagogical Illustration / Visual Prompt]
        Template --> Problem[Side-by-Side Hindi & Tribal Text]
        Template --> ResponseArea[Student Writing / Drawing Area]
    end
    
    SheetStructure --> Preview[In-App Preview & Validation]
    Preview --> PDFGen[Local Android PDF Canvas Engine]
    PDFGen --> Storage[Offline Storage / Direct Print]
```

---

## 13. Visual Flashcard Generation Pipeline

```mermaid
flowchart TD
    Concept[Vocabulary / Math / Phonics Concept] --> HindiSrc[Hindi Source Term]
    HindiSrc --> NMT[Offline ML Translation]
    NMT --> TargetTerm[Target Language Term]
    TargetTerm --> TTS[Local Offline TTS]
    TTS --> AudioAsset[Synthesized WAV/PCM Asset]
    
    Concept --> AssetLib[Local Offline Illustration Library]
    AssetLib --> ImgAsset[Vector / PNG Illustration]
    
    subgraph FlashcardComposition ["Flashcard Renderer"]
        HindiSrc & TargetTerm & AudioAsset & ImgAsset --> CardCanvas[Flashcard Canvas]
        CardCanvas --> InteractiveCard[Interactive Visual Card with Tap-to-Speak]
    end
    
    InteractiveCard --> OfflineDeck[Offline Flashcard Deck Storage]
```

---

## 14. Visual Flashcard Types

```mermaid
flowchart TD
    subgraph Type1 ["1. Vocabulary Flashcard"]
        V1[Hindi Word] --> V2[Target Tribal Word] --> V3[Illustration] --> V4[Audio Button]
    end

    subgraph Type2 ["2. Phonetics Flashcard"]
        P1[Hindi Letter / Akshar] --> P2[Tribal Script Glyph] --> P3[Phonetic Visual] --> P4[Sound Match Exercise]
    end

    subgraph Type3 ["3. Numeracy Flashcard"]
        N1[Devanagari Numeral] --> N2[Tribal Numeral / Script] --> N3[Visual Quantity / Counters] --> N4[Counting Task]
    end

    subgraph Type4 ["4. Classroom Objects Flashcard"]
        C1[Classroom Instruction / Item] --> C2[Tribal Translation] --> C3[Real-World Icon] --> C4[Pronunciation Guide]
    end
```

---

## 15. Worksheet Types Matrix

```mermaid
flowchart TD
    LO[Learning Outcome] --> TypeSelect{Select Worksheet Type}
    
    TypeSelect --> T1[1. Literacy Worksheet - Letter Tracing & Words]
    TypeSelect --> T2[2. Phonics Worksheet - Sound-Symbol Association]
    TypeSelect --> T3[3. Vocabulary Worksheet - Picture-Word Association]
    TypeSelect --> T4[4. Numeracy Worksheet - Number Sense & Counting]
    TypeSelect --> T5[5. Matching Worksheet - Hindi-to-Tribal Matching]
    TypeSelect --> T6[6. Assessment Worksheet - FLN Competency Evaluation]
    TypeSelect --> T7[7. Bilingual Story Worksheet - Dual Language Reading]
    
    T1 & T2 & T3 & T4 & T5 & T6 & T7 --> Format[Offline PDF Layout & Export]
```

---

## 16. Offline Content Synchronization Flow

```mermaid
flowchart TD
    subgraph OnlineSetup ["Phase 1: Initial Sync (One-Time / Maintenance)"]
        Internet([Internet Access]) --> SyncManager[Synchronization Manager]
        SyncManager --> DownloadModels[Download Quantized ONNX Models]
        SyncManager --> DownloadCurriculum[Download FLN Curricula & Asset Bundles]
        SyncManager --> Checksum[Cryptographic Checksum & SHA-256 Validation]
        Checksum --> LocalStorage[Write to Protected App Storage]
    end

    subgraph ClassroomOffline ["Phase 2: Offline Classroom Operation (100% Disconnected)"]
        LocalStorage --> OfflineFlag[Disable Network / Airplane Mode Verified]
        OfflineFlag --> ClassroomApp[Offline Pedagogy & Speech Suite]
        ClassroomApp --> NoCloud[Zero Cloud Calls / Zero Data Leaks]
    end
```

---

## 17. Offline Runtime Architecture

```mermaid
flowchart TD
    subgraph Tablet ["Low-Cost Android Tablet (Android 9+)"]
        App[Offline Suite Master App]
        
        subgraph LocalManagers ["Local System Managers"]
            App --> ModelMgr[Local Model Manager]
            App --> ContentMgr[Local Content & Curriculum Engine]
            App --> PDFMgr[Local PDF Canvas Engine]
            App --> DBMgr[SQLite / Room Local Database]
        end
        
        subgraph LocalML ["Local ML Runtime (Sherpa-ONNX / ONNX Runtime)"]
            ModelMgr --> LocalASR[Local ASR Engine]
            ModelMgr --> LocalNMT[Local NMT Engine]
            ModelMgr --> LocalTTS[Local TTS Engine]
        end
        
        subgraph Peripherals ["Device Peripherals"]
            LocalASR <-- Mic[Built-in Microphone]
            LocalTTS --> Speaker[Built-in Speaker]
            PDFMgr --> Screen[Display / Local Storage]
        end
    end
```

---

## 18. 2 GB RAM Device Architecture & Dynamic Memory Flow

```mermaid
flowchart TD
    Device[Android Tablet with 2GB Total RAM] --> RAMCheck{Available System RAM Check}
    
    RAMCheck -->|Available RAM < 600MB| AggressiveGC[Trigger Low-Memory Cleanup & Unload Inactive Models]
    RAMCheck -->|Available RAM >= 600MB| ModelLoader[Selective Single-Language Model Loader]
    
    subgraph MemoryOptimization ["Low-RAM Execution Strategy"]
        ModelLoader --> MMap[Memory-Mapped Model Files - mmap]
        MMap --> INT8[INT8 / UINT8 Quantized Weights]
        INT8 --> Arena[Pre-allocated Reusable Tensor Buffers]
        Arena --> Infer[Run Neural Inference]
        Infer --> Release[Immediately Free Intermediate Tensors]
        Release --> AudioStream[Stream Audio Directly to AudioTrack]
    end
```

---

## 19. Latency Optimization Workflow

```mermaid
flowchart TD
    Start([Measure Voice-to-Voice Latency]) --> Check{Total Latency <= 3.0 Seconds?}
    
    Check -- Yes --> Pass([Latency Compliance Verified])
    Check -- No --> Breakdown{Identify Bottleneck Component}
    
    Breakdown -->|ASR > 400ms| OptASR[Optimize VAD Truncation + Conformer Chunk Size]
    Breakdown -->|NMT > 500ms| OptNMT[Reduce Beam Size to 1 + Apply INT8 Quantization]
    Breakdown -->|TTS > 800ms| OptTTS[Prune Vocoder Layers + Multi-thread ONNX Synthesis]
    Breakdown -->|Audio > 200ms| OptAudio[Reduce AudioTrack Buffer Size & Pre-roll]
    
    OptASR & OptNMT & OptTTS & OptAudio --> Retest[Re-benchmark on Physical Hardware]
    Retest --> Check
```

---

## 20. Memory Optimization Workflow

```mermaid
flowchart TD
    StartMem([Monitor Process Resident Set Size]) --> CheckMem{App RAM Usage > 450 MB?}
    
    CheckMem -- No --> Normal([Memory Status Healthy])
    CheckMem -- Yes --> Action1[Unload Models for Inactive Languages]
    
    Action1 --> Action2[Clear In-Memory Audio Waveform Caches]
    Action2 --> Action3[Verify Zero Duplicate Model Instances]
    Action3 --> Action4[Force Garbage Collection on Script Buffers]
    Action4 --> Action5[Enable mmap Zero-Copy File Descriptors]
    
    Action5 --> Recheck([Re-measure RAM Footprint])
```

---

## 21. Model Development to Mobile Export Pipeline

```mermaid
flowchart LR
    DevPyTorch[PyTorch / Transformers Model in GPU Environment] --> TorchScript[Export to TorchScript / FX Graph]
    TorchScript --> ONNXGraph[Export to Standard ONNX Graph]
    ONNXGraph --> Simplifier[ONNX-Simplifier Graph Optimization]
    Simplifier --> QuantEngine[INT8 Dynamic / Static Quantization]
    QuantEngine --> MobileValidate[Verify Numerical Output vs PyTorch FP32]
    MobileValidate --> SherpaPkg[Bundle into Mobile ONNX Asset Package]
```

---

## 22. Model Quantization Pipeline

```mermaid
flowchart TD
    FP32[FP32 Model Weights ~1.2 GB] --> Calibration[Representative Calibration Dataset - IndicCorp]
    Calibration --> QuantMethod{Quantization Approach}
    
    QuantMethod --> WeightOnly[Dynamic INT8 Weight-Only Quantization]
    QuantMethod --> FullQuant[Static INT8 Weight + Activation Quantization]
    
    WeightOnly & FullQuant --> CompModel[INT8 Quantized Model ~300 MB]
    CompModel --> AccuracyCheck{WER / BLEU Degradation < 1.5%?}
    
    AccuracyCheck -- Yes --> DeployModel[Approved for 2GB RAM Deployment]
    AccuracyCheck -- No --> FineTuneQuant[Quantization-Aware Training QAT]
    FineTuneQuant --> CompModel
```

---

## 23. On-Device Privacy & Data Boundary

```mermaid
flowchart LR
    subgraph OnDeviceBoundary ["100% On-Device Execution (Android Sandbox)"]
        TeacherSpeech([Teacher Voice]) --> Mic[Microphone]
        Mic --> RAM[Volatile RAM Only]
        RAM --> ASR[Local ASR]
        ASR --> NMT[Local NMT]
        NMT --> TTS[Local TTS]
        TTS --> Speaker[Device Speaker]
    end

    subgraph ExternalWorld ["External Network / Cloud"]
        CloudServer[Cloud Servers]
        ThirdParty[Third-Party APIs]
    end

    RAM -.->|BLOCKED: Zero Data Transmission| CloudServer
    RAM -.->|BLOCKED: No Telemetry / No Logging| ThirdParty
```

---

## 24. Comprehensive Error Handling Matrix

```mermaid
flowchart TD
    Input([User Input Received]) --> C1{Device Compatible? Android 9+ / RAM OK}
    C1 -- No --> E1[Display System Requirements Warning]
    C1 -- Yes --> C2{Selected Language Model Deployed?}
    
    C2 -- No --> E2["Display 'MODEL REQUIRED / NOT YET DEPLOYED'"]
    C2 -- Yes --> C3{ASR Capture & Decoding Successful?}
    
    C3 -- No --> E3[Prompt Teacher to Repeat Speech]
    C3 -- Yes --> C4{NMT Translation Returned Valid Tokens?}
    
    C4 -- No --> E4[Display Translation Engine Failure Alert]
    C4 -- Yes --> C5{Unicode Target Script Validation Passed?}
    
    C5 -- No --> E5[Display Target Script Rendering Error]
    C5 -- Yes --> C6{Acoustic TTS Synthesis Successful?}
    
    C6 -- No --> E6[Display Audio Synthesis Failure Alert]
    C6 -- Yes --> Output([Stream Audio & Render Bilingual Text])
```

---

## 25. Teacher Dashboard Navigation Architecture

```mermaid
flowchart TD
    Home([Teacher Dashboard Home]) --> Tab1[1. Real-Time Translation]
    Home --> Tab2[2. FLN Curriculum Planner]
    Home --> Tab3[3. Visual & Audio Flashcards]
    Home --> Tab4[4. Bilingual Worksheets]
    Home --> Tab5[5. Offline Library & Sync]
    Home --> Tab6[6. Device Diagnostics & Benchmark]
```

---

## 26. Real-Time Translation Screen Flow

```mermaid
flowchart TD
    Screen[Open Real-Time Translation Screen] --> SelectLang[Select Target: Ho / Mundari / Santali]
    SelectLang --> LoadModel[Lazy-Load Target Model into Memory]
    
    LoadModel --> ReadyState[Status: READY / Latency: 0ms]
    ReadyState --> TapMic[Tap Microphone Button]
    
    TapMic --> Record[Record Hindi Audio & Run VAD]
    Record --> ASRState[ASR Decoding: Display Hindi Devanagari]
    ASRState --> NMTState[NMT Decoding: Display Target Tribal Script]
    NMTState --> TTSState[TTS Generation: Stream Target Audio]
    
    TTSState --> DisplayMetrics["Display Real Metrics:\nASR: 340ms | NMT: 390ms | TTS: 720ms | Total: 1450ms"]
```

---

## 27. Curriculum Screen Flow

```mermaid
flowchart TD
    Start[Open Curriculum Screen] --> SelectClass[Select Class: 1 / 2 / 3]
    SelectClass --> SelectSubject[Select Subject: Literacy / Numeracy / EVS]
    SelectSubject --> SelectCompetency[Select NIPUN FLN Competency]
    SelectCompetency --> SelectLO[Select Learning Outcome]
    
    SelectLO --> LoadHindiCurriculum[Load Structured Hindi Lesson Content]
    LoadHindiCurriculum --> TriggerTranslate[Trigger Offline NMT Engine]
    TriggerTranslate --> ShowBilingual[Display Side-by-Side Lesson & Teacher Prompts]
```

---

## 28. Flashcard Screen Flow

```mermaid
flowchart TD
    Start[Open Flashcards Screen] --> SelectTopic[Select Topic / Vocabulary Unit]
    SelectTopic --> SelectTargetLang[Select Target Language]
    SelectTargetLang --> CardGen[Generate Flashcard Deck]
    
    CardGen --> CardView[Display Card: Hindi + Tribal + Illustration]
    CardView --> AudioTap[Tap Speaker Icon]
    AudioTap --> PlayTTS[Play On-Demand Offline Synthesized Audio]
    CardView --> SaveDeck[Save Deck to Offline Library]
```

---

## 29. Worksheet Screen Flow

```mermaid
flowchart TD
    Start[Open Worksheet Screen] --> SelectLO[Select Learning Outcome & Activity Type]
    SelectLO --> SelectFormat[Select Layout: Tracing / Matching / Math / Story]
    SelectFormat --> SelectLang[Select Target Language]
    
    SelectLang --> BuildSheet[Execute Offline Translation & Layout Engine]
    BuildSheet --> PreviewSheet[Interactive Bilingual Worksheet Preview]
    PreviewSheet --> EditPrompts[Optional Teacher Edit of Instructions]
    EditPrompts --> ExportPDF[Export Print-Ready Offline PDF]
```

---

## 30. Offline Library Flow

```mermaid
flowchart TD
    Library[Open Offline Library] --> CatSelector{Select Category}
    
    CatSelector --> Cat1[Lesson Guides]
    CatSelector --> Cat2[Audio Flashcard Decks]
    CatSelector --> Cat3[Saved PDF Worksheets]
    
    Cat1 --> ViewGuide[Read Bilingual Guides Offline]
    Cat2 --> PlayDeck[Review & Play Audio Offline]
    Cat3 --> SharePrint[Print via Local Wi-Fi Direct / Bluetooth]
```

---

## 31. Development to Production Environment Isolation

```mermaid
flowchart LR
    subgraph DevEnv ["Development & Training Environment (Cloud / Colab / Workstation)"]
        GPU[NVIDIA T4 / A100 GPUs]
        Train[Model Training & Fine-Tuning]
        Weights[Raw FP32 PyTorch Checkpoints]
        Tokens[Hugging Face / API Credentials]
        Export[ONNX INT8 Export & Optimization]
    end

    subgraph PackageBuild ["Build & Packaging Stage"]
        Clean[Strip Secrets & Credentials]
        Verify[Verify Zero Cloud Dependencies]
        Bundle[Bundle ONNX Models + SQLite Curriculum + Assets]
        APK[Compile Android Release APK]
    end

    subgraph ProdEnv ["Production Runtime (Classroom Tablets)"]
        APK --> Install[Install on Android 9+ 2GB Device]
        Install --> OfflineApp[100% Offline Runtime]
    end

    DevEnv --> PackageBuild
```

---

## 32. Final Acceptance Verification Flow

```mermaid
flowchart TD
    A[Install Production APK on Android 9+ 2GB RAM Tablet] --> B[Perform Initial One-Time Sync & Download]
    B --> C[Physically Turn Off Wi-Fi & Mobile Data]
    C --> D[Launch App in Airplane Mode]
    
    D --> E{Offline Health Check}
    E --> F[Test Hindi Voice Input ➔ ASR]
    F --> G[Test IndicTrans2 Santali NMT]
    G --> H[Test Custom Santali TTS Audio Playback]
    H --> I[Verify Total Latency <= 3.0 Seconds]
    I --> J[Verify Peak Process RAM < 450 MB]
    J --> K[Generate Bilingual Worksheet & Export PDF]
    K --> L[Generate Visual Flashcard & Play Audio]
    L --> M{All Criteria Met?}
    
    M -- Yes --> PASS([VERIFICATION PASSED: Production Classroom Ready])
    M -- No --> FAIL([VERIFICATION FAILED: Review Logs & Remediate])
```

---

## 33. Architectural Responsibility Boundaries

| System Responsibility | Component Owner | Implementation Scope | Strict Architectural Boundary |
| :--- | :--- | :--- | :--- |
| **Content Rules** | `CurriculumManager`, `LearningOutcomeManager` | NIPUN Bharat competencies, grade levels, worksheet schemas, card layout rules | Contains zero translation logic and zero audio synthesis code. |
| **Linguistic Translation** | `TranslationEngine`, Model Adapters | `IndicTrans2` (Santali), Offline Ho NMT, Offline Mundari NMT | Pure neural sequence-to-sequence translation. No hardcoded dictionaries or phrasebook fallbacks allowed. |
| **Speech Synthesis** | `TTSManager`, Voice Engines | Custom Santali Indic Parler-TTS, Ho TTS, Mundari TTS | Converts validated phonetic/Unicode text to acoustic waveforms. Does not perform language translation. |
| **User Interface** | Dashboard, Presentation Views | Real-Time Translator, Flashcard Viewer, PDF Renderer | Handles display, audio playback, touch controls, and latency metric reporting. |
