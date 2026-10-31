/**
 * FlashLearn HTML - learning content and code-assembly exercises.
 */
const FlashLearnData = {
    topics: [
        {
            id: 'pengenalan_html',
            name: 'Pengenalan HTML',
            icon: 'code',
            theme: 'orange',
            description: 'Pengertian, fungsi, tag, elemen, dan atribut',
            cards: [
                { term: 'HTML', definition: 'HTML (HyperText Markup Language) adalah bahasa markah standar yang digunakan untuk menyusun struktur dan konten halaman web.' },
                { term: 'Fungsi HTML', definition: 'Fungsi utama HTML (HyperText Markup Language) adalah membentuk kerangka dan menyusun struktur konten sebuah halaman web.' },
                { term: 'Tag', definition: 'Tag adalah penanda elemen HTML yang ditulis menggunakan tanda kurung sudut, misalnya <h1> (Heading 1) atau <p> (Paragraph).' },
                { term: 'Elemen', definition: 'Elemen HTML adalah satu kesatuan utuh yang umumnya terdiri dari tag pembuka, isi atau konten, dan tag penutup.' },
                { term: 'Atribut', definition: 'Atribut memberikan informasi atau konfigurasi tambahan pada elemen HTML, misalnya href (Hypertext Reference) pada tautan.' }
            ]
        },
        {
            id: 'struktur_html',
            name: 'Struktur Dasar HTML',
            icon: 'account_tree',
            theme: 'blue',
            description: 'DOCTYPE, html, head, title, dan body',
            cards: [
                { term: '<!DOCTYPE html>', definition: 'Deklarasi <!DOCTYPE html> (Document Type Declaration) menyatakan tipe dokumen dan standar versi HTML yang digunakan (HTML5).' },
                { term: '<html>', definition: 'Elemen <html> (HyperText Markup Language) adalah elemen akar (root element) yang membungkus seluruh dokumen HTML.' },
                { term: '<head>', definition: 'Elemen <head> (Document Header) memuat metadata dan informasi penting tentang dokumen yang tidak ditampilkan langsung di halaman web.' },
                { term: '<title>', definition: 'Elemen <title> (Document Title) menentukan judul halaman web yang ditampilkan pada tab peramban (browser).' },
                { term: '<body>', definition: 'Elemen <body> (Document Body) memuat seluruh konten utama halaman web yang ditampilkan langsung kepada pengguna.' }
            ],
            ideExample: {
                fileName: 'struktur.html',
                code: [
                    '<!DOCTYPE html>',
                    '<html>',
                    '<head>',
                    '  <title>Struktur Dasar HTML</title>',
                    '</head>',
                    '<body>',
                    '  <h1>Dokumen HTML5 Pertamaku</h1>',
                    '  <p>Konten utama ditampilkan di dalam elemen body.</p>',
                    '</body>',
                    '</html>'
                ].join('\n')
            }
        },
        {
            id: 'pemformatan_teks',
            name: 'Pemformatan Teks',
            icon: 'format_bold',
            theme: 'purple',
            description: 'Heading, paragraf, penekanan, dan pindah baris',
            cards: [
                { term: '<h1> sampai <h6>', definition: 'Elemen <h1> sampai <h6> (Heading 1 hingga Heading 6) digunakan untuk membuat judul dengan hierarki dari tingkat 1 (terbesar) hingga tingkat 6 (terkecil).' },
                { term: '<p>', definition: 'Elemen <p> (Paragraph) digunakan untuk membuat dan membungkus paragraf teks.' },
                { term: '<strong>', definition: 'Elemen <strong> (Strong Importance) menandai teks penting dan umumnya ditampilkan tebal (bold).' },
                { term: '<em>', definition: 'Elemen <em> (Emphasis) memberi penekanan makna pada teks dan umumnya ditampilkan miring (italic).' },
                { term: '<br>', definition: 'Elemen <br> (Line Break) digunakan untuk membuat pindah baris tanpa jeda paragraf baru.' }
            ],
            ideExample: {
                fileName: 'format-teks.html',
                code: [
                    '<!DOCTYPE html>',
                    '<html>',
                    '<head>',
                    '  <title>Pemformatan Teks</title>',
                    '</head>',
                    '<body>',
                    '  <h1>Judul Utama (h1)</h1>',
                    '  <h2>Subjudul Materi (h2)</h2>',
                    '  <p>',
                    '    Teks <strong>penting (tebal)</strong> dan <em>ditekankan (miring)</em>.<br>',
                    '    Kalimat ini berada pada baris baru setelah tag br.',
                    '  </p>',
                    '</body>',
                    '</html>'
                ].join('\n')
            }
        },
        {
            id: 'link_gambar',
            name: 'Link dan Gambar',
            icon: 'link',
            theme: 'green',
            description: 'Tautan, gambar, dan atribut pendukungnya',
            cards: [
                { term: '<a>', definition: 'Elemen <a> (Anchor) digunakan untuk membuat tautan atau hyperlink ke halaman web atau sumber lain.' },
                { term: 'href', definition: 'Atribut href (Hypertext Reference) menentukan alamat URL tujuan dari sebuah tautan.' },
                { term: '<img>', definition: 'Elemen <img> (Image) digunakan untuk menyisipkan dan menampilkan gambar pada halaman HTML.' },
                { term: 'src', definition: 'Atribut src (Source) menentukan sumber atau lokasi berkas gambar yang ditampilkan.' },
                { term: 'alt', definition: 'Atribut alt (Alternative Text) menyediakan teks deskripsi alternatif apabila berkas gambar gagal dimuat.' }
            ],
            ideExample: {
                fileName: 'link-gambar.html',
                code: [
                    '<!DOCTYPE html>',
                    '<html>',
                    '<head>',
                    '  <title>Link dan Gambar</title>',
                    '</head>',
                    '<body>',
                    '  <h1>Tautan dan Gambar HTML</h1>',
                    '  <p>Kunjungi <a href="https://example.com">Website Contoh</a>.</p>',
                    '  <img src="assets/logo.png" alt="Logo Aplikasi FlashLearn">',
                    '</body>',
                    '</html>'
                ].join('\n')
            }
        },
        {
            id: 'list_html',
            name: 'List',
            icon: 'format_list_bulleted',
            theme: 'amber',
            description: 'Daftar berurutan, tidak berurutan, dan item list',
            cards: [
                { term: '<ul>', definition: 'Elemen <ul> (Unordered List) digunakan untuk membuat daftar tidak berurutan dengan penanda titik (bullet).' },
                { term: '<ol>', definition: 'Elemen <ol> (Ordered List) digunakan untuk membuat daftar berurutan dengan penomoran angka atau huruf.' },
                { term: '<li>', definition: 'Elemen <li> (List Item) digunakan untuk menandai setiap item di dalam elemen <ul> maupun <ol>.' },
                { term: '<dl>, <dt>, <dd>', definition: 'Elemen <dl> (Description List) digunakan untuk membuat daftar istilah bersama <dt> (Description Term) dan penjelasannya <dd> (Description Details).' },
                { term: 'Nested List', definition: 'Nested List (Daftar Bersarang) dibuat dengan menempatkan elemen daftar <ul> atau <ol> baru di dalam elemen <li>.' }
            ],
            ideExample: {
                fileName: 'list.html',
                code: [
                    '<!DOCTYPE html>',
                    '<html>',
                    '<head>',
                    '  <title>List pada HTML</title>',
                    '</head>',
                    '<body>',
                    '  <h1>Daftar Materi HTML</h1>',
                    '  <ol>',
                    '    <li>Struktur Dasar</li>',
                    '    <li>Jenis List (Nested List):',
                    '      <ul>',
                    '        <li>Unordered List (ul)</li>',
                    '        <li>Ordered List (ol)</li>',
                    '      </ul>',
                    '    </li>',
                    '  </ol>',
                    '  <dl>',
                    '    <dt>HTML</dt>',
                    '    <dd>Bahasa markup penyusun halaman web.</dd>',
                    '  </dl>',
                    '</body>',
                    '</html>'
                ].join('\n')
            }
        },
        {
            id: 'tabel_html',
            name: 'Tabel',
            icon: 'table_chart',
            theme: 'rose',
            description: 'Struktur tabel, baris, sel header, dan penggabungan sel',
            cards: [
                { term: '<table>', definition: 'Elemen <table> (Table) digunakan sebagai pembungkus utama untuk menyusun dan menampilkan data dalam bentuk tabel baris dan kolom.' },
                { term: '<tr>', definition: 'Elemen <tr> (Table Row) digunakan untuk membuat baris mendatar di dalam sebuah tabel.' },
                { term: '<th>', definition: 'Elemen <th> (Table Header) digunakan untuk membuat sel judul kolom atau baris yang ditampilkan tebal dan rata tengah.' },
                { term: '<td>', definition: 'Elemen <td> (Table Data) digunakan untuk membuat sel yang memuat data biasa di dalam baris tabel.' },
                { term: 'colspan & rowspan', definition: 'Atribut colspan (Column Span) digunakan untuk menggabungkan beberapa kolom, dan rowspan (Row Span) untuk menggabungkan beberapa baris menjadi satu sel.' }
            ],
            ideExample: {
                fileName: 'tabel.html',
                code: [
                    '<!DOCTYPE html>',
                    '<html>',
                    '<head>',
                    '  <title>Tabel pada HTML</title>',
                    '</head>',
                    '<body>',
                    '  <h1>Jadwal Belajar HTML</h1>',
                    '  <table>',
                    '    <tr>',
                    '      <th colspan="3">Rekap Progres Siswa</th>',
                    '    </tr>',
                    '    <tr>',
                    '      <th>Hari</th>',
                    '      <th>Materi</th>',
                    '      <th>Status</th>',
                    '    </tr>',
                    '    <tr>',
                    '      <td rowspan="2">Senin</td>',
                    '      <td>List HTML</td>',
                    '      <td>Selesai</td>',
                    '    </tr>',
                    '    <tr>',
                    '      <td>Tabel HTML</td>',
                    '      <td>Selesai</td>',
                    '    </tr>',
                    '  </table>',
                    '</body>',
                    '</html>'
                ].join('\n')
            }
        }
    ],

    exercises: [
        {
            id: 'struktur_dasar', title: 'Struktur Dasar HTML',
            instruction: 'Susun seluruh potongan kode menjadi dokumen HTML yang benar.',
            blocks: [
                { id: 'a', code: '<!DOCTYPE html>' }, { id: 'b', code: '<html>' },
                { id: 'c', code: '<head>' }, { id: 'd', code: '<title>Latihan Pertama</title>' },
                { id: 'e', code: '</head>' }, { id: 'f', code: '<body>' },
                { id: 'g', code: '<h1>Halo Dunia</h1>' }, { id: 'h', code: '</body>' }, { id: 'i', code: '</html>' }
            ],
            correctOrder: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']
        },
        {
            id: 'heading_paragraf', title: 'Heading dan Paragraf',
            instruction: 'Susun kode agar halaman menampilkan judul “Belajar HTML” dan paragraf yang sesuai.',
            blocks: [
                { id: 'a', code: '<!DOCTYPE html>' }, { id: 'b', code: '<html>' }, { id: 'c', code: '<body>' },
                { id: 'd', code: '<h1>Belajar HTML</h1>' }, { id: 'e', code: '<p>Saya sedang mempelajari HTML.</p>' },
                { id: 'f', code: '</body>' }, { id: 'g', code: '</html>' }
            ],
            correctOrder: ['a', 'b', 'c', 'd', 'e', 'f', 'g']
        },
        {
            id: 'format_teks', title: 'Pemformatan Teks',
            instruction: 'Susun kode yang menampilkan judul “HTML Dasar” dan teks penting dengan tampilan tebal.',
            blocks: [
                { id: 'a', code: '<!DOCTYPE html>' }, { id: 'b', code: '<html>' }, { id: 'c', code: '<body>' },
                { id: 'd', code: '<h1>HTML Dasar</h1>' }, { id: 'e', code: '<p><strong>Pelajari konsep penting HTML.</strong></p>' },
                { id: 'f', code: '</body>' }, { id: 'g', code: '</html>' }
            ],
            correctOrder: ['a', 'b', 'c', 'd', 'e', 'f', 'g']
        },
        {
            id: 'tautan', title: 'Tautan',
            instruction: 'Susun kode untuk menampilkan tautan “Buka situs contoh” menuju https://www.example.com.',
            blocks: [
                { id: 'a', code: '<!DOCTYPE html>' }, { id: 'b', code: '<html>' }, { id: 'c', code: '<body>' },
                { id: 'd', code: '<a href="https://www.example.com">Buka situs contoh</a>' }, { id: 'e', code: '</body>' }, { id: 'f', code: '</html>' }
            ],
            correctOrder: ['a', 'b', 'c', 'd', 'e', 'f']
        },
        {
            id: 'gambar', title: 'Gambar',
            instruction: 'Susun kode untuk menampilkan gambar dengan sumber dan teks alternatif yang tepat.',
            blocks: [
                { id: 'a', code: '<!DOCTYPE html>' }, { id: 'b', code: '<html>' }, { id: 'c', code: '<body>' },
                { id: 'd', code: '<img src="gambar-belajar.jpg" alt="Ilustrasi belajar HTML">' }, { id: 'e', code: '</body>' }, { id: 'f', code: '</html>' }
            ],
            correctOrder: ['a', 'b', 'c', 'd', 'e', 'f']
        },
        {
            id: 'daftar_tidak_berurutan', title: 'Daftar Tidak Berurutan',
            instruction: 'Susun kode untuk menampilkan subjudul “Topik HTML” diikuti daftar tidak berurutan.',
            blocks: [
                { id: 'a', code: '<!DOCTYPE html>' }, { id: 'b', code: '<html>' }, { id: 'c', code: '<body>' },
                { id: 'd', code: '<h2>Topik HTML</h2>' }, { id: 'e', code: '<ul>' },
                { id: 'f', code: '<li>List dan Tabel</li>' }, { id: 'g', code: '</ul>' },
                { id: 'h', code: '</body>' }, { id: 'i', code: '</html>' }
            ],
            correctOrder: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']
        },
        {
            id: 'daftar_berurutan', title: 'Daftar Berurutan',
            instruction: 'Susun kode daftar berurutan dari langkah pertama hingga langkah kedua dengan urutan yang tepat.',
            blocks: [
                { id: 'a', code: '<!DOCTYPE html>' }, { id: 'b', code: '<html>' }, { id: 'c', code: '<body>' },
                { id: 'd', code: '<ol>' }, { id: 'e', code: '<li>Langkah 1: Pelajari Materi</li>' },
                { id: 'f', code: '<li>Langkah 2: Kerjakan Latihan</li>' }, { id: 'g', code: '</ol>' },
                { id: 'h', code: '</body>' }, { id: 'i', code: '</html>' }
            ],
            correctOrder: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']
        },
        {
            id: 'tabel_dasar', title: 'Tabel Dasar HTML',
            instruction: 'Susun kode untuk membuat tabel sederhana dengan baris judul kolom di bagian atas dan baris data di bawahnya.',
            blocks: [
                { id: 'a', code: '<!DOCTYPE html>' }, { id: 'b', code: '<html>' }, { id: 'c', code: '<body>' },
                { id: 'd', code: '<table>' }, { id: 'e', code: '<tr><th>Nama</th><th>Nilai</th></tr>' },
                { id: 'f', code: '<tr><td>Andi</td><td>95</td></tr>' }, { id: 'g', code: '</table>' },
                { id: 'h', code: '</body>' }, { id: 'i', code: '</html>' }
            ],
            correctOrder: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']
        },
        {
            id: 'tabel_colspan', title: 'Penggabungan Sel Tabel',
            instruction: 'Susun kode tabel yang memiliki judul gabungan 2 kolom (colspan) di baris pertama dan rincian data di baris kedua.',
            blocks: [
                { id: 'a', code: '<!DOCTYPE html>' }, { id: 'b', code: '<html>' }, { id: 'c', code: '<body>' },
                { id: 'd', code: '<table>' }, { id: 'e', code: '<tr><th colspan="2">Data Siswa</th></tr>' },
                { id: 'f', code: '<tr><td>Budi</td><td>Kelas X</td></tr>' }, { id: 'g', code: '</table>' },
                { id: 'h', code: '</body>' }, { id: 'i', code: '</html>' }
            ],
            correctOrder: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']
        },
        {
            id: 'gabungan_list_tabel', title: 'Gabungan List dan Tabel',
            instruction: 'Susun kode halaman yang menampilkan judul bagian, daftar materi, lalu diikuti tabel jadwal belajar.',
            blocks: [
                { id: 'a', code: '<!DOCTYPE html>' }, { id: 'b', code: '<html>' }, { id: 'c', code: '<body>' },
                { id: 'd', code: '<h2>Rangkuman Belajar</h2>' }, { id: 'e', code: '<ul><li>Materi List dan Tabel</li></ul>' },
                { id: 'f', code: '<table>' }, { id: 'g', code: '<tr><th>Hari</th><th>Target</th></tr>' },
                { id: 'h', code: '<tr><td>Senin</td><td>Selesai</td></tr>' }, { id: 'i', code: '</table>' },
                { id: 'j', code: '</body>' }, { id: 'k', code: '</html>' }
            ],
            correctOrder: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k']
        }
    ],

    getTopicById(id) {
        return this.topics.find(topic => topic.id === id);
    },

    getExercises() {
        return this.exercises.map(exercise => ({
            ...exercise,
            blocks: exercise.blocks.map(block => ({ ...block })),
            correctOrder: [...exercise.correctOrder]
        }));
    },

    getTotalCards() {
        return this.topics.reduce((total, topic) => total + topic.cards.length, 0);
    }
};
