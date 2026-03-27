import { useState, useEffect } from "react";
import "./App.css";

import { db, auth, provider } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";

import {
  signInWithPopup,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("home");

  const [posts, setPosts] = useState([]);
  const [chats, setChats] = useState([]);

  const [editingProfile, setEditingProfile] = useState(false);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [photo, setPhoto] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");

  const [chatOpen, setChatOpen] = useState(false);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");

  // LOGIN
  const login = async () => {
    const result = await signInWithPopup(auth, provider);
    const uid = result.user.uid;

    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      setUser(snap.data());
    } else {
      const newUser = {
        uid,
        name: result.user.displayName,
        photo: result.user.photoURL,
        city: "",
      };

      await setDoc(ref, newUser);
      setUser(newUser);
    }
  };

  const logout = () => {
    signOut(auth);
    setUser(null);
  };

  useEffect(() => {
    onAuthStateChanged(auth, async (u) => {
      if (u) {
        const snap = await getDoc(doc(db, "users", u.uid));
        if (snap.exists()) setUser(snap.data());
      }
    });
  }, []);

  // POSTS
  const fetchPosts = async () => {
    const snap = await getDocs(collection(db, "posts"));
    setPosts(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // CHATS
  useEffect(() => {
    if (!user) return;

    onSnapshot(collection(db, "chats"), (snap) => {
      const all = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const mine = all.filter((c) => c.users?.includes(user.uid));
      setChats(mine);
    });
  }, [user]);

  // PERFIL
  const saveProfile = async () => {
    const ref = doc(db, "users", user.uid);
    const updated = { ...user, name, city, photo };

    await setDoc(ref, updated);
    setUser(updated);
    setEditingProfile(false);
  };

  const handleProfileImage = (e) => {
    const reader = new FileReader();
    reader.onloadend = () => setPhoto(reader.result);
    if (e.target.files[0]) reader.readAsDataURL(e.target.files[0]);
  };

  // POST
  const handleImage = (e) => {
    const reader = new FileReader();
    reader.onloadend = () => setImage(reader.result);
    if (e.target.files[0]) reader.readAsDataURL(e.target.files[0]);
  };

  const handlePrice = (e) => {
    setPrice(e.target.value.replace(/\D/g, ""));
  };

  const addPost = async () => {
    if (!title || !price || !description || !user) {
      alert("Preencha todos os campos");
      return;
    }

    await addDoc(collection(db, "posts"), {
      title,
      price,
      description,
      image,
      user,
      createdAt: Date.now(),
    });

    setShowForm(false);
    setTitle("");
    setPrice("");
    setDescription("");
    setImage("");

    fetchPosts();
    setPage("home");
  };

  const deletePost = async (id) => {
    if (!confirm("Tem certeza que deseja excluir?")) return;
    await deleteDoc(doc(db, "posts", id));
    fetchPosts();
  };

  // CHAT
  const openChat = async (post) => {
    if (post.user.uid === user.uid) return;

    const chatId = `${post.id}_${user.uid}`;
    const ref = doc(db, "chats", chatId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      await setDoc(ref, {
        postTitle: post.title,
        users: [user.uid, post.user.uid],
      });
    }

    setCurrentChat(chatId);
    setChatOpen(true);

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt")
    );

    onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => d.data()));
    });
  };

  const sendMessage = async () => {
    if (!message) return;

    await addDoc(collection(db, "chats", currentChat, "messages"), {
      text: message,
      user,
      createdAt: Date.now(),
    });

    setMessage("");
  };

  // AUTO SCROLL CHAT
  useEffect(() => {
    const el = document.querySelector(".chatMessages");
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  return (
    <>
      <div className="container">
        <div className="header">
          {!user ? (
            <button className="publishHeader" onClick={login}>
              Entrar com Google
            </button>
          ) : (
            <>
              <button className="logoutAbsolute" onClick={logout}>
                Sair
              </button>

              <div className="headerTop">
                <img src={user.photo} className="avatar" />
                <div>
                  <h2 className="logo">FreelaJá</h2>
                  <p className="userInfo">
                    {user.name} • {user.city || "Defina sua cidade"}
                  </p>
                </div>
              </div>

              <div className="menu">
                <button onClick={() => setPage("home")}>Home</button>
                <button onClick={() => setPage("posts")}>Meus Posts</button>
                <button onClick={() => setPage("chat")}>Mensagens</button>
                <button
                  onClick={() => {
                    setEditingProfile(true);
                    setName(user.name);
                    setCity(user.city);
                    setPhoto(user.photo);
                  }}
                >
                  Perfil
                </button>
              </div>

              <button
                className="publishHeader"
                onClick={() => setShowForm(true)}
              >
                + PUBLICAR FREELA
              </button>
            </>
          )}
        </div>

        {page === "home" && (
          <div className="posts">
            {posts.map((post) => {
              const isOwner = post.user?.uid === user?.uid;

              return (
                <div className="post" key={post.id}>
                  <img
                    src={post.image || "https://via.placeholder.com/300"}
                    className="postAvatar"
                  />

                  <strong>{post.title}</strong>

                  <p>{post.description}</p>

                  <p className="price">
                    R$ {Number(post.price).toLocaleString("pt-BR")}
                  </p>

                  {!isOwner && (
                    <button onClick={() => openChat(post)}>
                      Conversar
                    </button>
                  )}

                  {isOwner && (
                    <button onClick={() => deletePost(post.id)}>
                      Excluir
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {page === "posts" && (
          <div className="posts">
            {posts
              .filter((p) => p.user?.uid === user.uid)
              .map((post) => (
                <div key={post.id}>{post.title}</div>
              ))}
          </div>
        )}

        {page === "chat" && (
          <div>
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => {
                  setCurrentChat(chat.id);
                  setChatOpen(true);
                }}
              >
                {chat.postTitle}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL PUBLICAR */}
      {showForm && (
        <div className="overlay">
          <div className="modal">
            <input
              placeholder="Título"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <input
              placeholder="Preço"
              value={price}
              onChange={handlePrice}
            />

            <textarea
              placeholder="Descrição"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <input type="file" onChange={handleImage} />

            <button onClick={addPost}>Publicar</button>
            <button onClick={() => setShowForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* PERFIL */}
      {editingProfile && (
        <div className="overlay">
          <div className="modal">
            <input value={name} onChange={(e) => setName(e.target.value)} />
            <input value={city} onChange={(e) => setCity(e.target.value)} />
            <input type="file" onChange={handleProfileImage} />
            <button onClick={saveProfile}>Salvar</button>
          </div>
        </div>
      )}

      {/* CHAT */}
      {chatOpen && (
        <div className="chatBox">
          <button onClick={() => setChatOpen(false)}>✖</button>

          <div className="chatMessages">
            {messages.map((msg, i) => (
              <div key={i}>{msg.text}</div>
            ))}
          </div>

          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button onClick={sendMessage}>Enviar</button>
        </div>
      )}
    </>
  );
}

export default App;