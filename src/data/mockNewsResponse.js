const mockNewsResponse = {
  status: 'ok',
  totalResults: 4,
  articles: [
    {
      title: 'Learning React in 2024: Practical Patterns for Students',
      description:
        'A practical guide for building modern React apps with reusable components and clean architecture.',
      url: 'https://react.dev/learn',
      urlToImage:
        'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=900&q=80',
    },
    {
      title: 'How Software Engineering Students Can Build Better Projects',
      description:
        'Tips for planning features, organizing folders, and writing maintainable code for semester assignments.',
      url: 'https://www.freecodecamp.org/news/',
      urlToImage:
        'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=80',
    },
    {
      title: 'Effective Study Methods for Web Development Courses',
      description:
        'Study workflow recommendations for mastering APIs, state management, and front-end debugging.',
      url: 'https://developer.mozilla.org/en-US/docs/Learn',
      urlToImage:
        'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80',
    },
    {
      title: 'From Homework to Portfolio: Presenting Your Learning Projects',
      description:
        'How to document assignments and transform class projects into portfolio-ready case studies.',
      url: 'https://roadmap.sh/',
      urlToImage:
        'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=900&q=80',
    },
  ],
}

export default mockNewsResponse
