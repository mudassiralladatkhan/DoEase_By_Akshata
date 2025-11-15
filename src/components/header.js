export class Header {
  constructor(user) {
    this.user = user;
  }

  render() {
    const header = document.createElement('header');
    header.className = 'header';

    const initials = this.user.username.substring(0, 2).toUpperCase();

    header.innerHTML = `
      <div class="header-content">
        <div class="logo">
          <span class="logo-icon">📘</span>
          <span>DoEase</span>
        </div>
        <div class="user-info">
          <div class="user-avatar">${initials}</div>
          <span>${this.user.username}</span>
        </div>
      </div>
    `;

    return header;
  }
}
