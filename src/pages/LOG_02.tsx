import React, {useState} from 'react';
import logo from "@/assets/logo.png";

export default function LOG_02() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("환영합니다", { username, password });
  }

  return (
    <div className="bg-color-background-netural-secondary w-full min-w-[1431px] min-h-[1059px] relative">
      <div className="absolute top-[102px] left-[270px] w-[891px] h-[875px] bg-netrual-mid "/>
  `   <div className="absolute top-[139px left-[633px] w-[165px] h-[165px] bg-netrual-mid "/>

      <img
        className="absolute top-[143px] left-[646px] w-[162px] h-40 aspect-[1.01]"
        alt="Logo"
        src={logo}
      />

      <form onSubmit={handleSubmit}>
        <div className="absolute top-[346px] left-[415px] w-[601px] h[87px] bg-netrual-mid rounded-[10px">
          <label htmlFor="username" className="sr-only">
            아이디
          </label>
          <input
            id = "username"
            type = "text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="아이디"
            className="top-[367px] left-[435px] opacity-50 text-black absolutte w-[519px]
            [font-familjy: 'Inter-Regular', Helvetica] font-normal text-[44px] tarcking-[0]
            leading-[normal] whitespace-nowrap bg-transparent"
            aria-label = "아이디"
          />
        </div>

        <div className="absolute top-[457px] left-[415px] w-[601px] h-[87px] bg-netural-mid rounded-[10px]">
          <label htmlFor="password" className="sr-only">
            비밀번호
          </label>
          <input
            id = "password"
            type = "password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="비밀번호"
            className="top-[479px] left-[435px] opacity-50 text-black absolutte w-[519px]
            [font-family: 'Inter-Regular', Helvetica] font-normal text-[44px] tracking-[0]
            leading-[normal] whitespace-nowrap bg-transparent"
            aria-label="비밀번호"
          />
        </div>

        <button
          type="submit"
          className="top[568px] left-[415px] w-[601px] h-[87px] bg-secondary rounded-[10px]
          cursor-pointer hover:opacity-90 transition-opacity"
          aria-label="로그인"
        >
          <span className="top-[586px] left-[466px] text-netural-dark text-center absolute w-[519px]
          [font-family: 'Inter-Regular', Helvetica] font-normal text-[44px] tracking-[0]
          leading-[normal] whitespace-nowrap">
            로그인
          </span>
        </button>
      </form>

      <div className="absolute top-[679px] left-[415px] w-[634px] flex items-center justify-end gap-4">
        <label
          htmlFor="rememberMe"
          className="flex items-center curosr-pointer"
        >
          <input
            id = "rememberMe"
            type="checkbox"
            checked={rememberMe}
            onChange={() => setRememberMe(!rememberMe)}
            className="mr-2 w-6 h-6 cursor-pointer"
            aria-label="로그인유지"
          />
          <span className="[font-family: 'Inter-Regular, Helvetica] font-normal text-4xl text-black tracking-[0]
          leading-[normal] whitespace-nowrap">
            로그인 유지
          </span>
        </label>
        <nav className="flex gap-2">
          <a
            href="#find-id-pw"
            className="[font-family: 'Inter-Regular', Helvetica] font-normal text-black text-4xl
            tracking-[0] leading-[normal] whitespace-nowrap hover:underline"
          >
            ID/PW 찾기
          </a>
          <span className="[font-family: 'Inter-Regular', Helvetica] font-normal text-black text-4xl
          tracking-[0] leading-[normal] whitespace-nowrap">
            <a
              href="#register"
              className="[font-family: 'Inter-Regular', Helvetica] font-normal text-black text-4xl
            tracking-[0] leading-[normal] whitespace-nowrap hover:underline"
            >
            회원가입
          </a>
          </span>
        </nav>
      </div>

      <div
        className="absolute top-[863px] left-[391px] w-[634px] h-20 bg-netural-light" />

      </div>
  );
};