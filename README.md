# MonkMode - Yapay Zeka Destekli Verimlilik ve Odaklanma Ekosistemi

MonkMode, sıradan bir Pomodoro sayacı olmanın ötesine geçerek kullanıcılara **Yapay Zeka (LLM) destekli bir verimlilik koçu**, gelişmiş istatistikler ve akıllı takvim yönetimi sunan modern bir odaklanma ekosistemidir.

## ✨ Öne Çıkan Özellikler

*   **⏳ Akıllı Kronometre:** İstenilen sürede ayarlanabilen, kesintisiz odaklanma seansları.
*   **🤖 AI Verimlilik Asistanı (Chatbot):** Ollama altyapısıyla çalışan, kullanıcının istatistiklerine göre anlık motivasyon ve geri bildirim sağlayan interaktif sohbet botu.
*   **📅 Google Calendar Entegrasyonu:** Yapay zekanın oluşturduğu çalışma planlarının otomatik olarak Google Takvim'e senkronize edilmesi.
*   **📊 Gelişmiş Veri Analitiği:** Pandas kullanılarak kullanıcı seanslarının analiz edilmesi ve en verimli saatlerin tespit edilmesi.
*   **🎵 Odak Artırıcı Ortam:** Arayüz üzerinden kontrol edilebilen arka plan sesleri (Yağmur, Lo-Fi, Şömine vb.).
*   **💻 Masaüstü Widget:** Tarayıcıdan bağımsız, her zaman üstte kalan şık ve hafif masaüstü aracı.

## 🛠️ Kullanılan Teknolojiler (Tech Stack)

*   **Backend:** Python, Django, SQLite
*   **Yapay Zeka:** Ollama (Yerel LLM)
*   **Veri Analimi:** Pandas
*   **API & Entegrasyon:** Google OAuth 2.0, Google Calendar API
*   **Sürüm Kontrolü:** Git & GitHub (Feature Branch Workflow)

## 👥 Geliştirici Ekip (Cross-Functional Team)

Bu proje, Karadeniz Teknik Üniversitesi Bilgisayar Mühendisliği öğrencileri tarafından "Yazılım Mühendisliği" prensiplerine uygun olarak Agile (Çevik) metodoloji ile geliştirilmektedir:

*   **Sedanur Şeker (@4kuji):** Takım Lideri, Backend Mimarı & API Geliştiricisi
*   **Sırdaş Özdemir (@srdas26):** Frontend Geliştiricisi & UI/UX Tasarımcısı
*   **Şura Dağ (@suraadag):** Yapay Zeka (LLM) Uzmanı & Prompt Mühendisi
*   **Anıl Tok (@Anil5151):** Veri Analisti & İstatistik Modül Geliştiricisi

## 🚀 Kurulum ve Çalıştırma (Lokal Ortam)

Projeyi kendi bilgisayarınızda çalıştırmak için aşağıdaki adımları izleyin:

1.  **Repoyu Klonlayın:**
    ```bash
    git clone [https://github.com/4kuji/MonkMode.git](https://github.com/4kuji/MonkMode.git)
    cd MonkMode
    ```

2.  **Sanal Ortam (Virtual Environment) Oluşturun ve Aktif Edin:**
    ```bash
    python -m venv env
    # Windows için:
    env\Scripts\activate
    # MacOS/Linux için:
    source env/bin/activate
    ```

3.  **Gerekli Kütüphaneleri Yükleyin:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Veritabanını Hazırlayın:**
    ```bash
    python manage.py makemigrations
    python manage.py migrate
    ```

5.  **Sunucuyu Başlatın:**
    ```bash
    python manage.py runserver
    ```

Sistem varsayılan olarak `http://127.0.0.1:8000/` adresinde çalışmaya başlayacaktır.
