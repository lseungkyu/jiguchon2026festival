import os
import sys
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

def main():
    # 설정 값 정의
    service_account_file = '/Users/seungkyulee/Projects/jiguchon/service_account_key.json'
    target_email = 'lseungkyu@gmail.com'
    
    # 필수 파일 체크
    if not os.path.exists(service_account_file):
        print(f"❌ 에러: 자격 증명 파일이 존재하지 않습니다: {service_account_file}")
        sys.exit(1)

    print("🔑 서비스 계정 인증 진행 중...")
    # API 권한 스코프 설정 (설문지 바디 수정 및 드라이브 파일 공유)
    SCOPES = [
        'https://www.googleapis.com/auth/forms.body',
        'https://www.googleapis.com/auth/drive'
    ]
    
    try:
        creds = service_account.Credentials.from_service_account_file(
            service_account_file, scopes=SCOPES
        )
        
        # 구글 API 클라이언트 객체 생성
        forms_service = build('forms', 'v1', credentials=creds)
        drive_service = build('drive', 'v3', credentials=creds)
        
    except Exception as e:
        print(f"❌ 인증 실패 또는 라이브러리 로드 에러: {str(e)}")
        sys.exit(1)

    print("📝 학생준비위 구글 설문지(Forms) 생성 중...")
    
    # 1. 설문지 껍데기 생성
    form_title = '2026 지구촌 중등부 여름수련회 학생준비위 신청서'
    form_desc = (
        '와줘서 고마워! 수련회 직접 커스텀 기획단에 합류한 너희를 격하게 환영해 💖\n'
        '아래 설문을 작성해 주면 첫 모임을 준비하는 데 정말 큰 도움이 될 거야! 금방 끝나니까 솔직하게 적어줘! 😎'
    )
    
    try:
        # 구글 드라이브 API를 통해 설문지 파일 직접 생성 (서비스 계정 500 에러 방지용)
        file_metadata = {
            'name': form_title,
            'mimeType': 'application/vnd.google-apps.form'
        }
        form_file = drive_service.files().create(body=file_metadata, fields='id').execute()
        form_id = form_file.get('id')
        print(f"✅ 구글 드라이브 상에 설문지 파일 생성 완료 (ID: {form_id})")
        
    except HttpError as err:
        print(f"❌ 설문지 생성 중 API 에러 발생: {err}")
        if "API not enabled" in str(err):
            print("\n💡 해결 방법:")
            print("Google Cloud Console에서 'Google Drive API' 및 'Google Forms API'가 모두 '사용 설정(Enable)' 되어있는지 확인해 주세요.")
        sys.exit(1)

    # 2. 질문들 추가 (batchUpdate)
    print("📋 설문지 세부 질문 항목 구축 중...")
    
    requests = [
        # 0. 설문지 설명(Description) 세팅
        {
            "updateFormInfo": {
                "info": {
                    "description": form_desc
                },
                "updateMask": "description"
            }
        },
        # Q1. 이름 (필수)
        {
            "createItem": {
                "item": {
                    "title": "1. 너의 이름은 무엇이니? 🙋‍♂️",
                    "questionItem": {
                        "question": {
                            "required": True,
                            "textQuestion": {}
                        }
                    }
                },
                "location": {"index": 0}
            }
        },
        # Q2. 학교 및 학년 (필수)
        {
            "createItem": {
                "item": {
                    "title": "2. 지금 다니는 학교와 학년을 적어줘! 🏫",
                    "description": "예: 지구촌중 2학년",
                    "questionItem": {
                        "question": {
                            "required": True,
                            "textQuestion": {}
                        }
                    }
                },
                "location": {"index": 1}
            }
        },
        # Q3. 사는 동네 (선택)
        {
            "createItem": {
                "item": {
                    "title": "3. 사는 동네가 어디인가요? 🏡",
                    "description": "🚗 첫 모임(6월 14일) 후 귀가 차량 지원을 위해 필요한 정보예요!\n집으로 돌아갈 때 목자님 차편 지원이 필요 없는 친구는 안 적고 넘어가도 괜찮아요!\n작성할 때는 [ ~구 ~동 아파트 이름 ]까지 적어주세요! (예: 분당구 정자동 OO아파트)",
                    "questionItem": {
                        "question": {
                            "required": False,
                            "textQuestion": {}
                        }
                    }
                },
                "location": {"index": 2}
            }
        },
        # Q4. 귀가 차편 필요 여부 (필수)
        {
            "createItem": {
                "item": {
                    "title": "4. 첫 모임이 끝나고 귀가 차편 지원이 필요한가요? 🚗",
                    "description": "끝나고 안전하고 편안하게 집에 바래다줄 예정입니다!",
                    "questionItem": {
                        "question": {
                            "required": True,
                            "choiceQuestion": {
                                "type": "RADIO",
                                "options": [
                                    {"value": "🙆‍♂️ 네! 안전하게 타고 갈래요"},
                                    {"value": "🙅‍♂️ 아니요! 혼자 갈 수 있어요"}
                                ]
                            }
                        }
                    }
                },
                "location": {"index": 3}
            }
        },
        # Q5. 최애 간식 & 알레르기 (필수)
        {
            "createItem": {
                "item": {
                    "title": "5. 매달 맛있는 간식 투표/먹방 시 반영할 너의 최애 간식은? 🍕",
                    "description": "혹시 특정 음식 알레르기가 있다면 같이 꼭 적어줘! (소중하게 챙겨줄게 🤤)",
                    "questionItem": {
                        "question": {
                            "required": True,
                            "textQuestion": {}
                        }
                    }
                },
                "location": {"index": 4}
            }
        },
        # Q6. 가입 이유 (필수)
        {
            "createItem": {
                "item": {
                    "title": "6. 이 모임(학생준비위)에 참여하게 된 진짜 이유는? 😎",
                    "questionItem": {
                        "question": {
                            "required": True,
                            "choiceQuestion": {
                                "type": "RADIO",
                                "options": [
                                    {"value": "🎮 내 손으로 직접 수련회를 간지나게 디자인해 보고 싶어서!"},
                                    {"value": "🍕 맛있는 간식 투표와 먹방 혜택이 너무 끌려서!"},
                                    {"value": "😎 중등부의 '핵인싸 활동단'이라는 타이틀이 멋져 보여서!"},
                                    {"value": "목자님의 열렬한 구애와 추천으로 인해... 하하!"}
                                ]
                            }
                        }
                    }
                },
                "location": {"index": 5}
            }
        },
        # Q7. 나의 재능 (필수, 체크박스 중복선택)
        {
            "createItem": {
                "item": {
                    "title": "7. 내가 준비위에서 은근히 잘 발휘할 수 있는 나만의 재능은? ✨",
                    "description": "중복 선택 가능! 부담 없이 골라줘!",
                    "questionItem": {
                        "question": {
                            "required": True,
                            "choiceQuestion": {
                                "type": "CHECKBOX",
                                "options": [
                                    {"value": "🎲 보드게임 룰 설명왕 (설명서 읽고 친구들에게 전파)"},
                                    {"value": "🎪 호응 & 리액션 요정 (의견이 나오면 호응 폭격기)"},
                                    {"value": "🎵 힙한 찬양 음악 발굴러 (신나는 찬양 리스트 추천)"},
                                    {"value": "💡 예능급 게임 아이디어 뱅크 (꿀잼 아이디어 가득)"},
                                    {"value": "🤤 프로 먹방러 (간식을 세상에서 가장 맛있게 먹음)"}
                                ]
                            }
                        }
                    }
                },
                "location": {"index": 6}
            }
        },
        # Q8. 수련회 아이디어 스포일러 (선택)
        {
            "createItem": {
                "item": {
                    "title": "8. 수련회 때 이거 하면 대박 난다! 하는 신박한 게임이나 해보고 싶었던 활동 스포하기 🧠",
                    "description": "자유롭게 한 줄만 가볍게 적어줘!",
                    "questionItem": {
                        "question": {
                            "required": False,
                            "textQuestion": {}
                        }
                    }
                },
                "location": {"index": 7}
            }
        }
    ]
    
    try:
        forms_service.forms().batchUpdate(
            formId=form_id,
            body={"requests": requests}
        ).execute()
        print("✅ 모든 7가지 질문 추가 성공!")
    except HttpError as err:
        print(f"❌ 질문 추가 중 에러 발생: {err}")
        sys.exit(1)

    # 3. 설문지 소유권/편집자 공유 (lseungkyu@gmail.com)
    print(f"🔗 설문지 소유권/편집 권한을 {target_email} 로 공유 중...")
    
    try:
        permission = {
            'type': 'user',
            'role': 'writer',
            'emailAddress': target_email
        }
        drive_service.permissions().create(
            fileId=form_id,
            body=permission,
            fields='id',
            sendNotificationEmail=True
        ).execute()
        print(f"✅ 편집자 공유 완료! ({target_email} 메일함에 알림이 발송되었습니다.)")
        
    except HttpError as err:
        print(f"⚠️ 편집자 공유 중 일부 에러가 발생했습니다: {err}")
        print("하지만 설문지는 정상적으로 생성되었습니다.")
        if "API not enabled" in str(err):
            print("\n💡 해결 방법:")
            print("공유 기능을 작동시키려면 Google Cloud Console에서 'Google Drive API'를 추가로 '사용 설정(Enable)' 해주셔야 합니다.")

    # 4. 결과 보고 및 주소 출력
    public_url = f"https://docs.google.com/forms/d/{form_id}/viewform"
    editor_url = f"https://docs.google.com/forms/d/{form_id}/edit"
    
    print("\n" + "="*50)
    print("🎉 축하합니다! 구글 설문조사가 성공적으로 활성화되었습니다! 🎉")
    print("="*50)
    print(f"📱 [아이들 배포용 링크 (설문응답)]\n{public_url}")
    print("-"*50)
    print(f"🛠️ [목자님 전용 관리자 링크 (설문수정/결과확인)]\n{editor_url}")
    print("="*50)
    print(f"💡 lseungkyu@gmail.com 계정으로 로그인 후 위 관리자 링크에 들어가시면")
    print("   언제든지 설문을 수정하고 학생들의 실시간 답변 시트를 생성해 볼 수 있습니다.\n")

if __name__ == '__main__':
    main()
