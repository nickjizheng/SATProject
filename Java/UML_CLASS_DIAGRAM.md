# SAT Backend UML Class Diagram

This diagram extends your current `User` and `Question` sketch with:

- `FavoriteQuestion`
- `FavoriteWord`
- `Attempt` (`UserAnswerRecord` in code)
- `AuthController`
- `DashboardController`
- the relationships between the domain classes and controller/service layer

```mermaid
classDiagram
direction LR

class User {
  -Long id
  -String username
  -String email
  -String password
  -Boolean emailVerified
  -Boolean status
  -LocalDateTime createdAt
  -LocalDateTime updatedAt
  +register()
  +login()
  +verify()
}

class Question {
  <<SatQuestion>>
  -Integer id
  -String originalId
  -String domain
  -String visualsType
  -String visualsSvgContent
  -String questionText
  -String questionParagraph
  -String questionExplanation
  -String choiceA
  -String choiceB
  -String choiceC
  -String choiceD
  -String correctAnswer
  -LocalDateTime createdAt
  +getByDomain()
  +getById()
}

class FavoriteQuestion {
  -Long id
  -Long userId
  -Long questionId
  -String questionData
  -LocalDateTime createdAt
  -LocalDateTime updatedAt
  +addFavoriteQuestion()
  +removeFavoriteQuestion()
}

class FavoriteWord {
  -Long id
  -Long userId
  -String word
  -String wordData
  -LocalDateTime createdAt
  -LocalDateTime updatedAt
  +addFavoriteWord()
  +removeFavoriteWord()
}

class Attempt {
  <<UserAnswerRecord>>
  -Integer id
  -Integer userId
  -Integer questionId
  -String userAnswer
  -Boolean isCorrect
  -LocalDateTime answeredAt
  -String sessionId
  +submitAnswer()
}

class AuthController {
  +health()
  +sendVerificationCode(request)
  +register(request)
  +login(request)
  +logout(authorization)
}

class DashboardController {
  +getUserStats(userId)
  +getRecentActivities(userId, limit)
  +getStudyProgress(userId, days)
}

class UserService {
  +sendVerificationCode(email)
  +register(request)
  +login(request)
  +logout(token)
  +isTokenBlacklisted(token)
}

class DashboardService {
  +getUserStats(userId)
  +getRecentActivities(userId, limit)
  +getStudyProgress(userId, days)
}

User "1" --> "0..*" FavoriteQuestion : has
Question "1" --> "0..*" FavoriteQuestion : bookmarked in
User "1" --> "0..*" FavoriteWord : saves
User "1" --> "0..*" Attempt : makes
Question "1" --> "0..*" Attempt : answered by

AuthController ..> UserService : uses
DashboardController ..> DashboardService : uses

UserService ..> User : creates/authenticates
DashboardService ..> User : reads
DashboardService ..> Attempt : analyzes
DashboardService ..> FavoriteQuestion : counts
DashboardService ..> FavoriteWord : counts
DashboardService ..> Question : aggregates
```

## Notes

- `Question` in the diagram maps to the backend class `SatQuestion`.
- `Attempt` in the diagram maps to the backend class `UserAnswerRecord`.
- `AuthController` does not directly own entities; it depends on `UserService`, which manages `User` authentication and session flow.
- `DashboardController` depends on `DashboardService`, which reads `Attempt`, `FavoriteQuestion`, `FavoriteWord`, `Question`, and `User` data to build dashboard statistics.
