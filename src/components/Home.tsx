import { useNavigate, useSearchParams } from 'react-router-dom';
import { getTreeSource } from '../treeConfig';

function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Lấy source từ URL query parameter
  const sourceParam = searchParams.get('source');
  const sourceIndex = sourceParam ? parseInt(sourceParam, 10) : 0;
  const currentSource = getTreeSource(sourceIndex);

  const handleTreeClick = () => {
    // Chuyển sang christmas-tree với cùng source parameter
    navigate(`/christmas-tree?source=${sourceIndex}`);
  };

  return (
    <div style={{
      textAlign: 'center',
      padding: '20px',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <h1 style={{
        fontSize: '3rem',
        marginBottom: '40px',
        textShadow: '2px 2px 10px rgba(255, 255, 255, 0.3)',
        animation: 'twinkle 2s infinite'
      }}>
        Merry Christmas! 🎄
      </h1>
      {/* Hiển thị tên người nhận nếu có */}
      {currentSource.name && (
        <p style={{
          fontSize: '1.5rem',
          color: '#FFD700',
          marginTop: '-20px',
          marginBottom: '20px',
          textShadow: '1px 1px 5px rgba(255, 215, 0, 0.5)'
        }}>
          🎁 Dành tặng: <strong>{currentSource.name}</strong>
        </p>
      )}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
      <div style={{ cursor: 'pointer', display: 'inline-block' }} onClick={handleTreeClick} title={`Đi đến cây thông Noel 3D - ${currentSource.name}`}> 
        <div style={{ position: 'relative', display: 'inline-block', margin: '20px auto' }}>
          <div style={{ fontSize: '3rem', position: 'relative', zIndex: 10, animation: 'rotate 3s linear infinite' }}>⭐</div>
          <div style={{ 
            width: 0, 
            height: 0, 
            borderLeft: '60px solid transparent', 
            borderRight: '60px solid transparent',
            borderBottom: '80px solid #2d5016',
            margin: '-15px auto',
            position: 'relative'
          }}></div>
          <div style={{ 
            width: 0, 
            height: 0, 
            borderLeft: '80px solid transparent', 
            borderRight: '80px solid transparent',
            borderBottom: '100px solid #3d6b1f',
            margin: '-15px auto',
            position: 'relative'
          }}></div>
          <div style={{ 
            width: 0, 
            height: 0, 
            borderLeft: '100px solid transparent', 
            borderRight: '100px solid transparent',
            borderBottom: '120px solid #4d7c2f',
            margin: '-15px auto',
            position: 'relative'
          }}></div>
          <div style={{ 
            width: '40px', 
            height: '60px', 
            background: '#6f4e37',
            margin: '0 auto',
            borderRadius: '5px'
          }}></div>
          <div style={{
            position: 'absolute',
            top: '60px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '200px',
            height: '280px',
            pointerEvents: 'none'
          }}>
            <span style={{ position: 'absolute', fontSize: '1.5rem', animation: 'blink 1.5s infinite', color: '#ff4444', top: '20px', left: '80px' }}>●</span>
            <span style={{ position: 'absolute', fontSize: '1.5rem', animation: 'blink 1.5s infinite', color: '#ffeb3b', top: '60px', left: '50px', animationDelay: '0.3s' }}>●</span>
            <span style={{ position: 'absolute', fontSize: '1.5rem', animation: 'blink 1.5s infinite', color: '#2196f3', top: '60px', right: '50px', animationDelay: '0.6s' }}>●</span>
            <span style={{ position: 'absolute', fontSize: '1.5rem', animation: 'blink 1.5s infinite', color: '#ff69b4', top: '120px', left: '30px', animationDelay: '0.9s' }}>●</span>
            <span style={{ position: 'absolute', fontSize: '1.5rem', animation: 'blink 1.5s infinite', color: '#4caf50', top: '120px', right: '30px', animationDelay: '1.2s' }}>●</span>
            <span style={{ position: 'absolute', fontSize: '1.5rem', animation: 'blink 1.5s infinite', color: '#ff9800', top: '180px', left: '80px', animationDelay: '1.5s' }}>●</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
