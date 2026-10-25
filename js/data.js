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
                { term: 'HTML', definition: 'HTML adalah singkatan dari HyperText Markup Language.' },
                { term: 'Fungsi HTML', definition: 'HTML digunakan untuk menyusun struktur dan konten halaman web.' },
                { term: 'Tag', definition: 'Tag adalah penanda elemen HTML yang ditulis menggunakan tanda kurung sudut, misalnya <h1>.' },
                { term: 'Elemen', definition: 'Elemen HTML umumnya terdiri dari tag pembuka, isi, dan tag penutup.' },
                { term: 'Atribut', definition: 'Atribut memberikan informasi tambahan pada elemen, misalnya href pada tautan.' }
            ]
        },
        {
            id: 'struktur_html',
            name: 'Struktur Dasar HTML',
            icon: 'account_tree',
            theme: 'blue',
            description: 'DOCTYPE, html, head, title, dan body',
            cards: [
                { term: '<!DOCTYPE html>', definition: 'Deklarasi ini menyatakan bahwa dokumen menggunakan HTML5.' },
                { term: '<html>', definition: 'Elemen <html> adalah elemen akar yang membungkus seluruh dokumen HTML.' },
                { term: '<head>', definition: 'Elemen <head> memuat informasi tentang dokumen yang tidak ditampilkan sebagai konten utama.' },
                { term: '<title>', definition: 'Elemen <title> menentukan judul halaman pada tab peramban.' },
                { term: '<body>', definition: 'Elemen <body> memuat konten utama yang ditampilkan pada halaman.' }
            ]
        },
        {
            id: 'pemformatan_teks',
            name: 'Pemformatan Teks',
            icon: 'format_bold',
            theme: 'purple',
            description: 'Heading, paragraf, penekanan, dan pindah baris',
            cards: [
                { term: '<h1> sampai <h6>', definition: 'Elemen heading digunakan untuk membuat judul dengan tingkat hierarki yang berbeda.' },
                { term: '<p>', definition: 'Elemen <p> digunakan untuk membuat paragraf.' },
                { term: '<strong>', definition: 'Elemen <strong> menandai teks penting dan umumnya ditampilkan tebal.' },
                { term: '<em>', definition: 'Elemen <em> memberi penekanan pada teks dan umumnya ditampilkan miring.' },
                { term: '<br>', definition: 'Elemen <br> digunakan untuk membuat pindah baris.' }
            ]
        },
        {
            id: 'link_gambar',
            name: 'Link dan Gambar',
            icon: 'link',
            theme: 'green',
            description: 'Tautan, gambar, dan atribut pendukungnya',
            cards: [
                { term: '<a>', definition: 'Elemen <a> digunakan untuk membuat tautan ke halaman atau sumber lain.' },
                { term: 'href', definition: 'Atribut href menentukan alamat tujuan sebuah tautan.' },
                { term: '<img>', definition: 'Elemen <img> digunakan untuk menampilkan gambar pada halaman HTML.' },
                { term: 'src', definition: 'Atribut src menentukan sumber atau lokasi berkas gambar.' },
                { term: 'alt', definition: 'Atribut alt menyediakan teks alternatif apabila gambar tidak dapat ditampilkan.' }
            ]
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
