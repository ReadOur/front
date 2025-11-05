import React, {useState} from 'react'

export default function Register() {
  const [formData, setFormData] = useState({
    email:"",
    id: "",
    nickname: "",
    password: "",
    passwordConfirm: "",
  });

  const handleInputChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = (e:React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted: ", formData);
  };

  return (
    <div className="bg-white w-full min-w[1431px] min-h[1059px] relative">
      <div className="absoulute top-[87px] left-[270px] w-[891px] h-855px] bg-netrual-mid">
        <h1 className="top-[103px] left-[606px] w-[219px] text-black text-center absolute
        [font-family: 'Inter-Regular', Helvetica] font-normal text-4xl tracking-[0]
        leading-[normal]">
           회원가입
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="absolute top-[245px] left-[322px] w-[789px] h-[154px]">
            <div className="absolute top-0 left-0 w-[787px] h-[66px] bg-netrual-light" />

            <label htmlFor="email" className="sr-only">
              이메일
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange("email")}
              placeholder="이메일"
              className="top-[11px] left-[15px] w-[757px] h-[44px] opacity-50 text-black
              absolute [font-family: 'Inter-Regular', Helvetica] font-normal text-4xl tracking-[0]
              leading-[normal] placeholder:opacity-50 placeholder:text-black focus:opacity-100"
              aria-label="이메일"
              required
            />
          </div>

          <div className="absolute top-[347px] left-322px] w-[789px] h-[154px]">
            <div className="absoulte top-0 left-0 w-[787px] h-[66px] bg-netrual-light" />

            <label htmlFor="userId" className="sr-only">
              ID
            </label>
            <input
              type="text"
              id="userId"
              name="userId"
              value={formData.id}
              onChange={handleInputChange("id")}
              placeholder="ID"
              className="absolute top-[11px] left-[15px] w-[757px] h-[44px] opacity-50
               [font-family: 'Inter-Regular', Hevletica] font normal text-4xl tracking-[0]
              leading-[normal] placeholder:opacity-50 placeholder:text-black focus:opacity-100"
              aria-label="ID"
              required
            />
          </div>

          <div className="absolute top-[445px] left-[322px] w-[789px] h-[154px]">
            <div className="absolute top-0 left-0 w-[787px] h-[66px] bg-netrual-light" />

            <label htmlFor="nickname" className="sr-only">
              닉네임
            </label>
            <input
              type="text"
              id="nickname"
              name="nickname"
              value={formData.nickname}
              onChange={handleInputChange("nickname")}
              placeholder="닉네임"
              className="top-[11px] left-[15px] w-[757px] h-44px] opacity-50 text-black
              text-center absolute [font-family: 'Inter-Regular', Helvetica] font-normal text-4xl tracking-[0]
              leading-[normal] placeholder:opacity-50 placeholder:text-black focus:opacity-100"
              aria-label="Nickname"
              required
            />
          </div>

          <div className="absolute top-[540px] left-[321px] w-[790px] h-[235px]">
            <div className="absolute top-0 left-0 w-[787px] h-[66px] bg-netrual-light" />
            <label htmlFor="password" className="sr-only">
              비밀번호
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange("password")}
              placeholder="비밀번호"
              className="top-[11px] left-[15px] w-[757px] h-[44px] opacity-50 text-black
              absolute [font-family: 'Inter-Regular', Helvetica] font-normal text-4xl tracking-[0]
              leading-[normal] placeholder:opacity-50 placeholder:text-black focus:opacity-100"
              aria-label="Password"
              required
            />
          </div>

          <div className="top-[94px] left-px bg-netrual-light absolute w-[787px] h-66px">
          <label htmlFor="passwordConform" className="sr-only">
                 비밀번호 확인
          </label>
          <input
            type="password"
            id="passwordConform"
            name="passwordConform"
            value={formData.password}
            onChange={handleInputChange("passwordConform")}
            placeholder="비밀번호 확인"
            className="top-[11px] left-[15px] w-[757px] h-[44px] opacity-50 text-black
              absolute [font-family: 'Inter-Regular', Helvetica] font-normal text-4xl tracking-[0]
              leading-[normal] placeholder:opacity-50 placeholder:text-black focus:opacity-100"
            aria-label="Password Conform"
            required
          />
        </div>

          <div className="absolute top-[727px] left-[321px] w-[789px] h-[146px">
            <button
              type="submit"
              className="top-0 left-0 bg-secondary rounded-[10px] absolute w-[787px]
              h-[66px] cursor-pointer hover:opacioty-90 transition-opacity"
              aria-label="Submit"
              >
              <span className="top-[11px] left-[283px] w-[395px] text-netural-mid absolute
              [font-family: 'Inter-Regular', Helvetica] font-normal text-4xl tracking-[0]
              leading-[normal]">
                회원가입하기
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}